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
const CHUNK_EXPIRATION_MS = 3600000; // 1 hour

interface ChunkMetadata {
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
}

interface ImportStats {
  entriesImported: number;
  entriesSkipped: number;
  errors: string[];
}

/**
 * POST /api/admin/import-chunked
 * Upload a chunk of the backup file
 *
 * POST /api/admin/import-chunked?action=complete&sessionId=X&dryRun=true&skipExisting=true
 * Complete the chunked upload and process the import
 *
 * DELETE /api/admin/import-chunked?sessionId=X
 * Clean up a session manually
 */
export const handler: RouteHandler<unknown, SignedInState> = {
  async POST(ctx) {
    const url = new URL(ctx.req.url);
    const action = url.searchParams.get("action");

    if (action === "complete") {
      return await handleComplete(ctx);
    }

    return await handleChunkUpload(ctx);
  },

  async DELETE(ctx) {
    return await handleCleanup(ctx);
  },
};

/**
 * Handle uploading a single chunk
 */
async function handleChunkUpload(
  ctx: { req: Request; state: SignedInState },
): Promise<Response> {
  try {
    const body = await ctx.req.json();
    const { sessionId, chunkIndex, totalChunks, data } = body as ChunkMetadata;

    // Validate chunk metadata
    if (!sessionId || chunkIndex === undefined || !totalChunks || !data) {
      return Response.json(
        {
          error: "Invalid chunk metadata",
          message: "sessionId, chunkIndex, totalChunks, and data are required",
        },
        { status: 400 },
      );
    }

    // Store chunk in KV with expiration
    const chunkKey = ["import-session", sessionId, chunkIndex];
    await kv.set(chunkKey, data, { expireIn: CHUNK_EXPIRATION_MS });

    logger.info("Chunk uploaded", {
      userId: ctx.state.sessionUser.id,
      sessionId,
      chunkIndex,
      totalChunks,
    });

    return Response.json({
      success: true,
      sessionId,
      chunkIndex,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
    });
  } catch (error) {
    logger.error("Chunk upload failed", { error });
    return Response.json(
      {
        error: "Chunk upload failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle completion - reassemble chunks and process import
 */
async function handleComplete(
  ctx: { req: Request; state: SignedInState },
): Promise<Response> {
  const url = new URL(ctx.req.url);
  const sessionId = url.searchParams.get("sessionId");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const skipExisting = url.searchParams.get("skipExisting") === "true";

  if (!sessionId) {
    return Response.json(
      { error: "Missing sessionId parameter" },
      { status: 400 },
    );
  }

  logger.info("Starting chunked import completion", {
    userId: ctx.state.sessionUser.id,
    sessionId,
    dryRun,
    skipExisting,
  });

  try {
    // Retrieve all chunks for this session
    const chunks: string[] = [];
    const prefix = ["import-session", sessionId];
    const iter = kv.list({ prefix });

    for await (const entry of iter) {
      const chunkIndex = entry.key[2] as number;
      chunks[chunkIndex] = entry.value as string;
    }

    // Verify we have all chunks
    if (chunks.length === 0) {
      return Response.json(
        {
          error: "No chunks found",
          message: "Session may have expired or no chunks were uploaded",
        },
        { status: 404 },
      );
    }

    // Check for missing chunks
    const missingChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      if (!chunks[i]) {
        missingChunks.push(i);
      }
    }

    if (missingChunks.length > 0) {
      return Response.json(
        {
          error: "Missing chunks",
          message: `Chunks ${missingChunks.join(", ")} are missing`,
          missingChunks,
        },
        { status: 400 },
      );
    }

    // Reassemble backup content
    const backupContent = chunks.join("");

    logger.info("Chunks reassembled", {
      totalChunks: chunks.length,
      contentLength: backupContent.length,
    });

    // Process the backup content
    const result = await processBackup(backupContent, {
      dryRun,
      skipExisting,
      batchSize: DEFAULT_BATCH_SIZE,
    });

    // Clean up chunks after processing
    await cleanupSession(sessionId);

    const status = result.errors.length > 0 ? 207 : 200; // 207 = Multi-Status

    logger.info("Chunked import completed", {
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
    logger.error("Chunked import failed", { error });
    // Attempt cleanup even on failure
    await cleanupSession(sessionId).catch(() => {});

    return Response.json(
      {
        error: "Import failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle manual cleanup of a session
 */
async function handleCleanup(
  ctx: { req: Request },
): Promise<Response> {
  const url = new URL(ctx.req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return Response.json(
      { error: "Missing sessionId parameter" },
      { status: 400 },
    );
  }

  try {
    await cleanupSession(sessionId);
    return Response.json({
      success: true,
      message: "Session cleaned up",
    });
  } catch (error) {
    logger.error("Cleanup failed", { error });
    return Response.json(
      {
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Clean up all chunks for a session
 */
async function cleanupSession(sessionId: string): Promise<void> {
  const prefix = ["import-session", sessionId];
  const iter = kv.list({ prefix });
  const keysToDelete: Deno.KvKey[] = [];

  for await (const entry of iter) {
    keysToDelete.push(entry.key);
  }

  // Delete in batches
  for (let i = 0; i < keysToDelete.length; i += MAX_ATOMIC_OPERATIONS) {
    const batch = keysToDelete.slice(i, i + MAX_ATOMIC_OPERATIONS);
    const atomic = kv.atomic();

    for (const key of batch) {
      atomic.delete(key);
    }

    await atomic.commit();
  }

  logger.info("Session cleaned up", {
    sessionId,
    chunksDeleted: keysToDelete.length,
  });
}

/**
 * Processes backup content and imports entries
 * (Duplicated from import.ts to keep this endpoint isolated)
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
 * (Duplicated from import.ts to keep this endpoint isolated)
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
 * (Duplicated from import.ts to keep this endpoint isolated)
 */
function deserializeValue(serialized: unknown, isKvU64: boolean): unknown {
  if (isKvU64 && typeof serialized === "string") {
    return new Deno.KvU64(BigInt(serialized));
  }
  return serialized;
}
