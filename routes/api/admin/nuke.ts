import { RouteHandler } from "fresh";
import { SignedInState } from "@/utils/state.ts";
import { kv } from "@/db/kv.ts";
import logger from "@/utils/logger.ts";

const MAX_ATOMIC_OPERATIONS = 10;

/**
 * DELETE /api/admin/nuke
 *
 * Deletes ALL entries from the KV database.
 * WARNING: This is a destructive operation and cannot be undone!
 *
 * Use with extreme caution - typically only for development/testing.
 */
export const handler: RouteHandler<unknown, SignedInState> = {
  async DELETE(ctx) {
    logger.warn("NUKE operation initiated", {
      userId: ctx.state.sessionUser.id,
      userEmail: ctx.state.sessionUser.email,
    });

    try {
      // List all entries in the database
      const allKeys: Deno.KvKey[] = [];
      const iter = kv.list({ prefix: [] });

      for await (const entry of iter) {
        allKeys.push(entry.key);
      }

      if (allKeys.length === 0) {
        logger.info("NUKE: Database already empty");
        return Response.json({
          success: true,
          message: "Database is already empty",
          entriesDeleted: 0,
        });
      }

      // Delete entries in batches
      let deleted = 0;
      for (let i = 0; i < allKeys.length; i += MAX_ATOMIC_OPERATIONS) {
        const batch = allKeys.slice(i, i + MAX_ATOMIC_OPERATIONS);
        const atomic = kv.atomic();

        for (const key of batch) {
          atomic.delete(key);
        }

        const result = await atomic.commit();
        if (result.ok) {
          deleted += batch.length;
        } else {
          logger.error("NUKE: Failed to delete batch", { batchStart: i });
        }
      }

      logger.warn("NUKE operation completed", {
        userId: ctx.state.sessionUser.id,
        entriesDeleted: deleted,
        totalKeys: allKeys.length,
      });

      return Response.json({
        success: true,
        message: `Successfully deleted ${deleted} entries`,
        entriesDeleted: deleted,
      });
    } catch (error) {
      logger.error("NUKE operation failed", { error });
      return Response.json(
        {
          error: "Nuke operation failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
};
