import { RouteHandler } from "fresh";
import { SignedInState } from "@/utils/state.ts";
import { kv } from "@/db/kv.ts";
import logger from "@/utils/logger.ts";
import type {
  MigrationMetadata,
  SerializedKvEntry,
} from "@/tasks/kv-migration/types.ts";

const DEFAULT_BATCH_SIZE = 100;
const MAX_ATOMIC_OPERATIONS = 10;

interface ImportStats {
  entriesImported: number;
  entriesSkipped: number;
  errors: string[];
}

/**
 * POST /api/admin/import?dryRun=true&skipExisting=true
 *
 * Imports KV database backup from uploaded file or JSON body.
 * Accepts JSON Lines format (.jsonl) with entries and metadata.
 *
 * Query params:
 * - dryRun: If true, validates without writing (default: false)
 * - skipExisting: If true, skips keys that already exist (default: false)
 */
export const handler: RouteHandler<unknown, SignedInState> = {
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const dryRun = url.searchParams.get("dryRun") === "true";
    const skipExisting = url.searchParams.get("skipExisting") === "true";

    logger.info("Starting import operation", {
      userId: ctx.state.sessionUser.id,
      dryRun,
      skipExisting,
    });

    try {
      // Get backup content from request body
      const contentType = ctx.req.headers.get("content-type") || "";
      let backupContent: string;

      if (contentType.includes("multipart/form-data")) {
        // Handle file upload
        const formData = await ctx.req.formData();
        const file = formData.get("backup");

        if (!file || !(file instanceof File)) {
          return Response.json(
            {
              error: "Missing backup file",
              message: "Upload a .jsonl backup file",
            },
            { status: 400 },
          );
        }

        backupContent = await file.text();
      } else if (
        contentType.includes("application/json") ||
        contentType.includes("text/plain")
      ) {
        // Handle direct JSON/text upload
        backupContent = await ctx.req.text();
      } else {
        return Response.json(
          {
            error: "Unsupported content type",
            message: "Send as multipart/form-data or application/json",
          },
          { status: 400 },
        );
      }

      // Process the backup content
      const result = await processBackup(backupContent, {
        dryRun,
        skipExisting,
        batchSize: DEFAULT_BATCH_SIZE,
      });

      const status = result.errors.length > 0 ? 207 : 200; // 207 = Multi-Status

      logger.info("Import operation completed", {
        entriesImported: result.entriesImported,
        entriesSkipped: result.entriesSkipped,
        errorCount: result.errors.length,
        dryRun,
      });

      return Response.json(
        {
          success: result.errors.length === 0,
          entriesImported: result.entriesImported,
          entriesSkipped: result.entriesSkipped,
          errors: result.errors,
          dryRun,
          message: dryRun
            ? `Dry run: Would import ${result.entriesImported} entries`
            : `Imported ${result.entriesImported} entries`,
        },
        { status },
      );
    } catch (error) {
      logger.error("Import operation failed", { error });
      return Response.json(
        {
          error: "Import failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
};

/**
 * Processes backup content and imports entries
 */
async function processBackup(
  content: string,
  options: { dryRun: boolean; skipExisting: boolean; batchSize: number },
): Promise<ImportStats> {
  const stats: ImportStats = {
    entriesImported: 0,
    entriesSkipped: 0,
    errors: [],
  };

  let metadata: MigrationMetadata | null = null;
  const lines = content.split("\n");
  let batch: SerializedKvEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line);

      // Handle metadata line
      if (parsed.__metadata__) {
        metadata = parsed.__metadata__ as MigrationMetadata;
        logger.info("Found backup metadata", {
          totalEntries: metadata.totalEntries,
          exportedAt: metadata.exportStartedAt,
        });
        continue;
      }

      // Validate entry
      if (!parsed.key || parsed.value === undefined) {
        stats.errors.push(`Line ${i + 1}: Invalid entry format`);
        continue;
      }

      batch.push(parsed as SerializedKvEntry);

      // Process batch when it reaches the batch size
      if (batch.length >= options.batchSize) {
        const result = await processBatch(
          kv,
          batch,
          options.dryRun,
          options.skipExisting,
        );
        stats.entriesImported += result.imported;
        stats.entriesSkipped += result.skipped;
        stats.errors.push(...result.errors);
        batch = [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      stats.errors.push(`Line ${i + 1}: ${errorMessage}`);
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    const result = await processBatch(
      kv,
      batch,
      options.dryRun,
      options.skipExisting,
    );
    stats.entriesImported += result.imported;
    stats.entriesSkipped += result.skipped;
    stats.errors.push(...result.errors);
  }

  if (
    metadata &&
    stats.entriesImported + stats.entriesSkipped !== metadata.totalEntries
  ) {
    logger.warn("Entry count mismatch", {
      expected: metadata.totalEntries,
      actual: stats.entriesImported + stats.entriesSkipped,
    });
  }

  return stats;
}

/**
 * Processes a batch of entries, writing them to the database
 */
async function processBatch(
  kv: Deno.Kv,
  batch: SerializedKvEntry[],
  dryRun: boolean,
  skipExisting: boolean,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in smaller atomic batches (Deno KV has a limit per atomic operation)
  for (let i = 0; i < batch.length; i += MAX_ATOMIC_OPERATIONS) {
    const atomicBatch = batch.slice(i, i + MAX_ATOMIC_OPERATIONS);

    try {
      if (dryRun) {
        // In dry run, just count what would be imported
        imported += atomicBatch.length;
        continue;
      }

      if (skipExisting) {
        // Check which keys already exist
        const keys = atomicBatch.map((entry) => entry.key);
        const existingEntries = await kv.getMany(keys);

        const atomic = kv.atomic();
        let opsInAtomic = 0;

        for (let j = 0; j < atomicBatch.length; j++) {
          const entry = atomicBatch[j];
          const existingEntry = existingEntries[j];

          if (existingEntry.value !== null) {
            skipped++;
            continue;
          }

          const value = deserializeValue(entry.value, entry.isKvU64 ?? false);
          atomic.set(entry.key, value);
          opsInAtomic++;
        }

        if (opsInAtomic > 0) {
          const result = await atomic.commit();
          if (result.ok) {
            imported += opsInAtomic;
          } else {
            errors.push(
              `Failed to commit atomic batch (${opsInAtomic} operations)`,
            );
          }
        }
      } else {
        // Import all entries without checking
        const atomic = kv.atomic();

        for (const entry of atomicBatch) {
          const value = deserializeValue(entry.value, entry.isKvU64 ?? false);
          atomic.set(entry.key, value);
        }

        const result = await atomic.commit();
        if (result.ok) {
          imported += atomicBatch.length;
        } else {
          errors.push(
            `Failed to commit atomic batch (${atomicBatch.length} operations)`,
          );
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      errors.push(`Batch processing error: ${errorMessage}`);
    }
  }

  return { imported, skipped, errors };
}

/**
 * Deserializes a value, reconstructing special types like Deno.KvU64
 */
function deserializeValue(serialized: unknown, isKvU64: boolean): unknown {
  if (isKvU64 && typeof serialized === "string") {
    return new Deno.KvU64(BigInt(serialized));
  }
  return serialized;
}
