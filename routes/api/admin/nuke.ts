import { RouteHandler } from "fresh";
import { SignedInState } from "@/utils/state.ts";
import { kv } from "@/db/kv.ts";
import logger from "@/utils/logger.ts";

/**
 * DELETE /api/admin/nuke?confirm=yes
 *
 * Deletes all entries from the KV database.
 * Requires authentication and explicit confirmation.
 */
export const handler: RouteHandler<unknown, SignedInState> = {
  async DELETE(ctx) {
    const url = new URL(ctx.req.url);
    const confirm = url.searchParams.get("confirm");

    // Safety check: require explicit confirmation
    if (confirm !== "yes") {
      return Response.json(
        {
          error: "Missing confirmation",
          message: "Add ?confirm=yes to the URL to confirm database deletion",
        },
        { status: 400 },
      );
    }

    logger.info("Starting database nuke operation", {
      userId: ctx.state.sessionUser.id,
    });

    try {
      let deletedCount = 0;
      const batchSize = 1000;

      // Iterate through all keys and delete in batches
      const iter = kv.list({ prefix: [] });
      let batch: Deno.KvKey[] = [];

      for await (const entry of iter) {
        batch.push(entry.key);

        if (batch.length >= batchSize) {
          // Delete batch atomically
          const atomic = kv.atomic();
          for (const key of batch) {
            atomic.delete(key);
          }
          const result = await atomic.commit();

          if (!result.ok) {
            throw new Error("Atomic delete operation failed");
          }

          deletedCount += batch.length;
          logger.info("Deleted batch", {
            count: batch.length,
            total: deletedCount,
          });
          batch = [];
        }
      }

      // Delete remaining entries
      if (batch.length > 0) {
        const atomic = kv.atomic();
        for (const key of batch) {
          atomic.delete(key);
        }
        const result = await atomic.commit();

        if (!result.ok) {
          throw new Error("Atomic delete operation failed");
        }

        deletedCount += batch.length;
      }

      logger.info("Database nuke completed", { deletedCount });

      return Response.json(
        {
          success: true,
          deletedCount,
          message: `Successfully deleted ${deletedCount} entries`,
        },
        { status: 200 },
      );
    } catch (error) {
      logger.error("Database nuke failed", { error });
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
