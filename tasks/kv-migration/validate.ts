/**
 * Validation utilities for KV migration
 * Validates that data was migrated correctly from source to destination
 */

import type { ValidateOptions, ValidationResult } from "./types.ts";

/**
 * Validates that all data from source exists in destination
 */
export async function validateMigration(
  options: ValidateOptions,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const missingKeys: Deno.KvKey[] = [];
  const mismatchedValues: Deno.KvKey[] = [];
  let sourceCount = 0;
  let destinationCount = 0;

  try {
    console.log(`🔍 Opening source database: ${options.source}`);
    const sourceKv = await Deno.openKv(options.source);

    console.log(`🔍 Opening destination database: ${options.destination}`);
    const destKv = await Deno.openKv(options.destination);

    try {
      // Count entries in both databases
      console.log(`📊 Counting entries...`);

      const sourceListOptions = options.prefix
        ? { prefix: options.prefix }
        : { prefix: [] };
      const sourceIter = sourceKv.list(sourceListOptions);

      const keysToValidate: Deno.KvKey[] = [];

      for await (const entry of sourceIter) {
        sourceCount++;
        keysToValidate.push(entry.key);

        // Progress indicator
        if (sourceCount % 100 === 0) {
          console.log(`  Scanned ${sourceCount} source entries...`);
        }
      }

      console.log(`✅ Source database: ${sourceCount} entries`);

      // Count destination entries
      const destListOptions = options.prefix
        ? { prefix: options.prefix }
        : { prefix: [] };
      const destIter = destKv.list(destListOptions);

      for await (const _entry of destIter) {
        destinationCount++;

        // Progress indicator
        if (destinationCount % 100 === 0) {
          console.log(`  Scanned ${destinationCount} destination entries...`);
        }
      }

      console.log(`✅ Destination database: ${destinationCount} entries`);

      // Check if counts match
      if (sourceCount !== destinationCount) {
        errors.push(
          `Entry count mismatch: source has ${sourceCount}, destination has ${destinationCount}`,
        );
      }

      // Sample or validate all keys
      const keysToCheck = options.sampleSize && options.sampleSize > 0
        ? sampleArray(keysToValidate, options.sampleSize)
        : keysToValidate;

      console.log(
        `🔍 Validating ${keysToCheck.length} keys for data integrity...`,
      );

      // Validate in batches
      const batchSize = 100;
      for (let i = 0; i < keysToCheck.length; i += batchSize) {
        const batch = keysToCheck.slice(i, i + batchSize);

        const [sourceEntries, destEntries] = await Promise.all([
          sourceKv.getMany(batch),
          destKv.getMany(batch),
        ]);

        for (let j = 0; j < batch.length; j++) {
          const key = batch[j];
          const sourceEntry = sourceEntries[j];
          const destEntry = destEntries[j];

          // Check if key exists in destination
          if (destEntry.value === null) {
            missingKeys.push(key);
            continue;
          }

          // Deep compare values
          if (!deepEqual(sourceEntry.value, destEntry.value)) {
            mismatchedValues.push(key);
          }
        }

        // Progress indicator
        const validated = Math.min(i + batchSize, keysToCheck.length);
        if (validated % 1000 === 0) {
          console.log(`  Validated ${validated}/${keysToCheck.length} keys...`);
        }
      }

      console.log(`✅ Validation complete`);

      if (missingKeys.length > 0) {
        errors.push(`${missingKeys.length} keys missing in destination`);
        console.error(`❌ Missing keys: ${missingKeys.length}`);
      }

      if (mismatchedValues.length > 0) {
        errors.push(`${mismatchedValues.length} keys have mismatched values`);
        console.error(`❌ Mismatched values: ${mismatchedValues.length}`);
      }

      if (errors.length === 0) {
        console.log(`✅ All validations passed!`);
      }
    } finally {
      sourceKv.close();
      destKv.close();
    }

    return {
      success: errors.length === 0,
      sourceCount,
      destinationCount,
      missingKeys,
      mismatchedValues,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);

    console.error(`❌ Validation failed: ${errorMessage}`);

    return {
      success: false,
      sourceCount,
      destinationCount,
      missingKeys,
      mismatchedValues,
      errors,
    };
  }
}

/**
 * Deep equality comparison for KV values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Handle primitives
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Handle Deno.KvU64
  if (a instanceof Deno.KvU64 && b instanceof Deno.KvU64) {
    return a.value === b.value;
  }

  // Handle Uint8Array
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * Randomly samples an array
 */
function sampleArray<T>(array: T[], sampleSize: number): T[] {
  if (sampleSize >= array.length) return array;

  const sampled: T[] = [];
  const indices = new Set<number>();

  while (sampled.length < sampleSize) {
    const index = Math.floor(Math.random() * array.length);
    if (!indices.has(index)) {
      indices.add(index);
      sampled.push(array[index]);
    }
  }

  return sampled;
}

/**
 * Compares entry counts between source and destination
 */
export async function quickValidate(
  source: string,
  destination: string,
  prefix?: Deno.KvKey,
): Promise<{ sourceCount: number; destinationCount: number; match: boolean }> {
  const sourceKv = await Deno.openKv(source);
  const destKv = await Deno.openKv(destination);

  try {
    let sourceCount = 0;
    let destinationCount = 0;

    const listOptions = prefix ? { prefix } : { prefix: [] };

    for await (const _entry of sourceKv.list(listOptions)) {
      sourceCount++;
    }

    for await (const _entry of destKv.list(listOptions)) {
      destinationCount++;
    }

    return {
      sourceCount,
      destinationCount,
      match: sourceCount === destinationCount,
    };
  } finally {
    sourceKv.close();
    destKv.close();
  }
}
