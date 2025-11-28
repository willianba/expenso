/**
 * Import functionality for KV migration
 * Imports entries from a backup file to a destination KV database
 */

import type {
  ImportOptions,
  ImportResult,
  MigrationMetadata,
  SerializedKvEntry,
} from "./types.ts";

const DEFAULT_BATCH_SIZE = 100;
const MAX_ATOMIC_OPERATIONS = 10; // Deno KV atomic operation limit

/**
 * Deserializes a value, reconstructing special types like Deno.KvU64
 */
function deserializeValue(
  serialized: unknown,
  isKvU64: boolean,
): unknown {
  if (isKvU64 && typeof serialized === "string") {
    return new Deno.KvU64(BigInt(serialized));
  }
  return serialized;
}

/**
 * Imports entries from a backup file to destination KV database
 */
export async function importKvDatabase(
  options: ImportOptions,
): Promise<ImportResult> {
  const errors: string[] = [];
  let entriesImported = 0;
  let entriesSkipped = 0;

  try {
    // Open destination database
    console.log(`📂 Opening destination database: ${options.destination}`);
    const kv = await Deno.openKv(options.destination);

    try {
      // Open backup file
      console.log(`📖 Reading backup file: ${options.input}`);
      const file = await Deno.open(options.input, { read: true });

      const decoder = new TextDecoder();
      const buffer = new Uint8Array(1024 * 1024); // 1MB buffer
      let leftover = "";
      let lineNumber = 0;
      let metadata: MigrationMetadata | null = null;

      // Read file in chunks
      while (true) {
        const bytesRead = await file.read(buffer);
        if (bytesRead === null) break;

        const chunk = decoder.decode(buffer.slice(0, bytesRead));
        const lines = (leftover + chunk).split("\n");

        // Keep last incomplete line for next iteration
        leftover = lines.pop() || "";

        const batch: SerializedKvEntry[] = [];

        for (const line of lines) {
          lineNumber++;

          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            // Skip metadata line (can be anywhere, but typically last)
            if (parsed.__metadata__) {
              if (!metadata) {
                metadata = parsed.__metadata__ as MigrationMetadata;
                console.log(
                  `📊 Backup contains ${metadata.totalEntries} entries`,
                );
                console.log(
                  `📅 Exported from: ${metadata.sourceDatabase} at ${metadata.exportStartedAt}`,
                );
              }
              continue;
            }

            // Validate entry structure
            if (!parsed.key || parsed.value === undefined) {
              errors.push(
                `Line ${lineNumber}: Invalid entry format`,
              );
              continue;
            }

            batch.push(parsed as SerializedKvEntry);

            // Process batch when it reaches the batch size
            if (batch.length >= (options.batchSize ?? DEFAULT_BATCH_SIZE)) {
              const result = await processBatch(
                kv,
                batch,
                options.dryRun ?? false,
                options.skipExisting ?? false,
              );

              entriesImported += result.imported;
              entriesSkipped += result.skipped;
              errors.push(...result.errors);

              batch.length = 0; // Clear batch

              // Report progress
              if (options.onProgress) {
                options.onProgress(
                  entriesImported + entriesSkipped,
                  metadata?.totalEntries,
                );
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error
              ? error.message
              : String(error);
            errors.push(`Line ${lineNumber}: ${errorMessage}`);
          }
        }

        // Process remaining batch
        if (batch.length > 0) {
          const result = await processBatch(
            kv,
            batch,
            options.dryRun ?? false,
            options.skipExisting ?? false,
          );

          entriesImported += result.imported;
          entriesSkipped += result.skipped;
          errors.push(...result.errors);

          // Report progress
          if (options.onProgress) {
            options.onProgress(
              entriesImported + entriesSkipped,
              metadata?.totalEntries,
            );
          }
        }
      }

      file.close();

      console.log(
        `✅ Import complete: ${entriesImported} imported, ${entriesSkipped} skipped`,
      );

      if (options.dryRun) {
        console.log(`🔍 DRY RUN - No data was actually written`);
      }
    } finally {
      kv.close();
    }

    return {
      success: errors.length === 0,
      entriesImported,
      entriesSkipped,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);

    console.error(`❌ Import failed: ${errorMessage}`);

    return {
      success: false,
      entriesImported,
      entriesSkipped,
      errors,
    };
  }
}

/**
 * Processes a batch of entries, writing them to the destination database
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
