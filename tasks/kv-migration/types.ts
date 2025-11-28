/**
 * Shared types for KV migration operations
 */

/**
 * Represents a serialized KV entry that can be stored in backup files
 */
export interface SerializedKvEntry {
  key: Deno.KvKey;
  value: unknown;
  versionstamp: string;
  /** ISO 8601 timestamp of when this entry was exported */
  exportedAt: string;
  /** Special marker for KvU64 values since they need special handling */
  isKvU64?: boolean;
}

/**
 * Metadata about a migration backup file
 */
export interface MigrationMetadata {
  /** Timestamp when the export started */
  exportStartedAt: string;
  /** Timestamp when the export completed */
  exportCompletedAt?: string;
  /** Total number of entries exported */
  totalEntries: number;
  /** Source database identifier or URL */
  sourceDatabase: string;
  /** Optional prefix filter used during export */
  prefixFilter?: Deno.KvKey;
  /** Version of the migration tool */
  version: string;
}

/**
 * Progress callback for export/import operations
 */
export type ProgressCallback = (current: number, total?: number) => void;

/**
 * Options for export operation
 */
export interface ExportOptions {
  /** Source KV database connection string or path */
  source: string;
  /** Output file path for backup */
  output: string;
  /** Optional key prefix to filter exports */
  prefix?: Deno.KvKey;
  /** Batch size for reading entries */
  batchSize?: number;
  /** Progress callback */
  onProgress?: ProgressCallback;
}

/**
 * Options for import operation
 */
export interface ImportOptions {
  /** Destination KV database connection string or path */
  destination: string;
  /** Input backup file path */
  input: string;
  /** Batch size for writing entries */
  batchSize?: number;
  /** Dry run mode - don't actually write data */
  dryRun?: boolean;
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Skip entries that already exist in destination */
  skipExisting?: boolean;
}

/**
 * Options for validation operation
 */
export interface ValidateOptions {
  /** Source KV database connection string or path */
  source: string;
  /** Destination KV database connection string or path */
  destination: string;
  /** Optional key prefix to validate */
  prefix?: Deno.KvKey;
  /** Sample size for deep validation (0 = validate all) */
  sampleSize?: number;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  success: boolean;
  sourceCount: number;
  destinationCount: number;
  missingKeys: Deno.KvKey[];
  mismatchedValues: Deno.KvKey[];
  errors: string[];
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  success: boolean;
  entriesExported: number;
  outputFile: string;
  metadata: MigrationMetadata;
  errors: string[];
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  entriesImported: number;
  entriesSkipped: number;
  errors: string[];
}
