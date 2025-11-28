/**
 * Export functionality for KV migration
 * Exports all entries from a source KV database to a JSON Lines backup file
 */

import type {
  ExportOptions,
  ExportResult,
  MigrationMetadata,
  SerializedKvEntry,
} from "./types.ts";

const MIGRATION_VERSION = "1.0.0";
const DEFAULT_BATCH_SIZE = 1000;

/**
 * Serializes a KV value, handling special types like Deno.KvU64
 */
function serializeValue(value: unknown): {
  serialized: unknown;
  isKvU64: boolean;
} {
  if (value instanceof Deno.KvU64) {
    return {
      serialized: value.value.toString(),
      isKvU64: true,
    };
  }
  return {
    serialized: value,
    isKvU64: false,
  };
}

/**
 * Exports all entries from source KV database to a backup file
 */
export async function exportKvDatabase(
  options: ExportOptions,
): Promise<ExportResult> {
  const errors: string[] = [];
  const exportStartedAt = new Date().toISOString();
  let entriesExported = 0;

  try {
    // Open source database
    console.log(`📂 Opening source database: ${options.source}`);
    const kv = await Deno.openKv(options.source);

    // Create output file
    console.log(`📝 Creating backup file: ${options.output}`);
    const file = await Deno.open(options.output, {
      write: true,
      create: true,
      truncate: true,
    });

    const encoder = new TextEncoder();

    try {
      // List all entries with optional prefix filter
      console.log(
        `🔍 Scanning entries${
          options.prefix
            ? ` with prefix: ${JSON.stringify(options.prefix)}`
            : ""
        }...`,
      );

      const iter = options.prefix
        ? kv.list(
          { prefix: options.prefix },
          { batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE },
        )
        : kv.list(
          { prefix: [] },
          { batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE },
        );

      // Process entries
      for await (const entry of iter) {
        const { serialized, isKvU64 } = serializeValue(entry.value);

        const serializedEntry: SerializedKvEntry = {
          key: entry.key,
          value: serialized,
          versionstamp: entry.versionstamp,
          exportedAt: new Date().toISOString(),
          ...(isKvU64 && { isKvU64: true }),
        };

        // Write entry as JSON line
        await file.write(
          encoder.encode(JSON.stringify(serializedEntry) + "\n"),
        );

        entriesExported++;

        // Report progress
        if (options.onProgress && entriesExported % 100 === 0) {
          options.onProgress(entriesExported);
        }
      }

      console.log(`✅ Exported ${entriesExported} entries`);

      // Write metadata at the end as the last line
      const metadata: MigrationMetadata = {
        exportStartedAt,
        exportCompletedAt: new Date().toISOString(),
        totalEntries: entriesExported,
        sourceDatabase: options.source,
        prefixFilter: options.prefix,
        version: MIGRATION_VERSION,
      };

      await file.write(
        encoder.encode(
          JSON.stringify({ __metadata__: metadata }) + "\n",
        ),
      );
    } finally {
      file.close();
      kv.close();
    }

    // Final progress callback
    if (options.onProgress) {
      options.onProgress(entriesExported, entriesExported);
    }

    const metadata: MigrationMetadata = {
      exportStartedAt,
      exportCompletedAt: new Date().toISOString(),
      totalEntries: entriesExported,
      sourceDatabase: options.source,
      prefixFilter: options.prefix,
      version: MIGRATION_VERSION,
    };

    return {
      success: true,
      entriesExported,
      outputFile: options.output,
      metadata,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);

    console.error(`❌ Export failed: ${errorMessage}`);

    return {
      success: false,
      entriesExported,
      outputFile: options.output,
      metadata: {
        exportStartedAt,
        totalEntries: entriesExported,
        sourceDatabase: options.source,
        prefixFilter: options.prefix,
        version: MIGRATION_VERSION,
      },
      errors,
    };
  }
}

/**
 * Reads metadata from a backup file (stored as the last line)
 */
export async function readBackupMetadata(
  filePath: string,
): Promise<MigrationMetadata | null> {
  try {
    const file = await Deno.open(filePath, { read: true });

    try {
      // Get file size
      const stat = await file.stat();
      const fileSize = stat.size;

      if (fileSize === 0) {
        return null;
      }

      // Read the last chunk of the file to get the metadata line
      const chunkSize = Math.min(4096, fileSize);
      const buffer = new Uint8Array(chunkSize);

      await file.seek(fileSize - chunkSize, Deno.SeekMode.Start);
      const bytesRead = await file.read(buffer);

      if (bytesRead === null) {
        return null;
      }

      const decoder = new TextDecoder();
      const chunk = decoder.decode(buffer.slice(0, bytesRead));
      const lines = chunk.split("\n").filter((line) => line.trim());

      // Last non-empty line should be metadata
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const parsed = JSON.parse(lastLine);

        if (parsed.__metadata__) {
          return parsed.__metadata__ as MigrationMetadata;
        }
      }

      return null;
    } finally {
      file.close();
    }
  } catch (error) {
    console.error(`Failed to read metadata: ${error}`);
    return null;
  }
}
