#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net
/**
 * KV Migration CLI Tool
 *
 * Commands:
 *   export   - Export KV database to backup file
 *   import   - Import backup file to KV database
 *   validate - Validate migration between two databases
 *   info     - Show backup file information
 *
 * Usage:
 *   deno run -A tasks/kv-migration/cli.ts export --source <url> --output <file>
 *   deno run -A tasks/kv-migration/cli.ts import --destination <url> --input <file>
 *   deno run -A tasks/kv-migration/cli.ts validate --source <url> --destination <url>
 *   deno run -A tasks/kv-migration/cli.ts info --file <backup-file>
 */

import "@std/dotenv/load";
import { exportKvDatabase, readBackupMetadata } from "./export.ts";
import { importKvDatabase } from "./import.ts";
import { quickValidate, validateMigration } from "./validate.ts";
import type { ExportOptions, ImportOptions, ValidateOptions } from "./types.ts";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function showHelp() {
  console.log(`
${colors.bright}KV Migration Tool${colors.reset}

${colors.cyan}Commands:${colors.reset}
  export      Export KV database to backup file
  import      Import backup file to KV database
  validate    Validate migration between databases
  info        Show backup file information

${colors.cyan}Export Usage:${colors.reset}
  deno run -A tasks/kv-migration/cli.ts export \\
    --source <database-url> \\
    --output <backup-file> \\
    [--prefix <key-prefix>] \\
    [--batch-size <number>]

${colors.cyan}Import Usage:${colors.reset}
  deno run -A tasks/kv-migration/cli.ts import \\
    --destination <database-url> \\
    --input <backup-file> \\
    [--batch-size <number>] \\
    [--dry-run] \\
    [--skip-existing]

${colors.cyan}Validate Usage:${colors.reset}
  deno run -A tasks/kv-migration/cli.ts validate \\
    --source <database-url> \\
    --destination <database-url> \\
    [--prefix <key-prefix>] \\
    [--sample-size <number>] \\
    [--quick]

${colors.cyan}Info Usage:${colors.reset}
  deno run -A tasks/kv-migration/cli.ts info \\
    --file <backup-file>

${colors.cyan}Examples:${colors.reset}
  # Export from local database
  deno run -A tasks/kv-migration/cli.ts export \\
    --source ./local.db \\
    --output backup.jsonl

  # Export from remote Deno Deploy database
  deno run -A tasks/kv-migration/cli.ts export \\
    --source "https://api.deno.com/databases/<id>/connect" \\
    --output backup.jsonl

  # Import to destination with dry run
  deno run -A tasks/kv-migration/cli.ts import \\
    --destination ./new.db \\
    --input backup.jsonl \\
    --dry-run

  # Validate migration
  deno run -A tasks/kv-migration/cli.ts validate \\
    --source ./old.db \\
    --destination ./new.db
`);
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith("--")) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      parsed[key] = true;
    } else {
      if (!parsed._command) {
        parsed._command = arg;
      }
    }
  }

  return parsed;
}

function createProgressBar(total?: number) {
  let lastUpdate = 0;
  const updateInterval = 100; // Update every 100 entries

  return (current: number, finalTotal?: number) => {
    const actualTotal = finalTotal ?? total;

    if (current - lastUpdate < updateInterval && current !== actualTotal) {
      return;
    }

    lastUpdate = current;

    if (actualTotal) {
      const percent = Math.floor((current / actualTotal) * 100);
      const bar = "█".repeat(Math.floor(percent / 2));
      const empty = "░".repeat(50 - Math.floor(percent / 2));
      console.log(
        `  Progress: [${bar}${empty}] ${percent}% (${current}/${actualTotal})`,
      );
    } else {
      console.log(`  Progress: ${current} entries processed`);
    }
  };
}

async function runExport(args: Record<string, string | boolean>) {
  const source = args.source as string;
  const output = args.output as string;
  const prefix = args.prefix ? JSON.parse(args.prefix as string) : undefined;
  const batchSize = args["batch-size"]
    ? parseInt(args["batch-size"] as string)
    : undefined;

  if (!source || !output) {
    console.error(
      `${colors.red}Error: --source and --output are required${colors.reset}`,
    );
    Deno.exit(1);
  }

  const options: ExportOptions = {
    source,
    output,
    prefix,
    batchSize,
    onProgress: createProgressBar(),
  };

  const result = await exportKvDatabase(options);

  if (result.success) {
    console.log(
      `${colors.green}✅ Export successful!${colors.reset}`,
    );
    console.log(`   Entries exported: ${result.entriesExported}`);
    console.log(`   Output file: ${result.outputFile}`);
  } else {
    console.error(
      `${colors.red}❌ Export failed${colors.reset}`,
    );
    result.errors.forEach((err) => console.error(`   ${err}`));
    Deno.exit(1);
  }
}

async function runImport(args: Record<string, string | boolean>) {
  const destination = args.destination as string;
  const input = args.input as string;
  const batchSize = args["batch-size"]
    ? parseInt(args["batch-size"] as string)
    : undefined;
  const dryRun = !!args["dry-run"];
  const skipExisting = !!args["skip-existing"];

  if (!destination || !input) {
    console.error(
      `${colors.red}Error: --destination and --input are required${colors.reset}`,
    );
    Deno.exit(1);
  }

  // Read metadata to get total for progress bar
  const metadata = await readBackupMetadata(input);

  const options: ImportOptions = {
    destination,
    input,
    batchSize,
    dryRun,
    skipExisting,
    onProgress: createProgressBar(metadata?.totalEntries),
  };

  const result = await importKvDatabase(options);

  if (result.success) {
    console.log(
      `${colors.green}✅ Import successful!${colors.reset}`,
    );
    console.log(`   Entries imported: ${result.entriesImported}`);
    if (result.entriesSkipped > 0) {
      console.log(`   Entries skipped: ${result.entriesSkipped}`);
    }
  } else {
    console.error(
      `${colors.red}❌ Import failed${colors.reset}`,
    );
    result.errors.forEach((err) => console.error(`   ${err}`));
    Deno.exit(1);
  }
}

async function runValidate(args: Record<string, string | boolean>) {
  const source = args.source as string;
  const destination = args.destination as string;
  const prefix = args.prefix ? JSON.parse(args.prefix as string) : undefined;
  const sampleSize = args["sample-size"]
    ? parseInt(args["sample-size"] as string)
    : undefined;
  const quick = !!args.quick;

  if (!source || !destination) {
    console.error(
      `${colors.red}Error: --source and --destination are required${colors.reset}`,
    );
    Deno.exit(1);
  }

  if (quick) {
    const result = await quickValidate(source, destination, prefix);
    console.log(`${colors.cyan}Quick Validation:${colors.reset}`);
    console.log(`  Source: ${result.sourceCount} entries`);
    console.log(`  Destination: ${result.destinationCount} entries`);

    if (result.match) {
      console.log(
        `${colors.green}✅ Counts match!${colors.reset}`,
      );
    } else {
      console.log(
        `${colors.red}❌ Counts do not match${colors.reset}`,
      );
      Deno.exit(1);
    }
  } else {
    const options: ValidateOptions = {
      source,
      destination,
      prefix,
      sampleSize,
    };

    const result = await validateMigration(options);

    if (result.success) {
      console.log(
        `${colors.green}✅ Validation successful!${colors.reset}`,
      );
      console.log(`   Source: ${result.sourceCount} entries`);
      console.log(`   Destination: ${result.destinationCount} entries`);
    } else {
      console.error(
        `${colors.red}❌ Validation failed${colors.reset}`,
      );
      result.errors.forEach((err) => console.error(`   ${err}`));

      if (result.missingKeys.length > 0) {
        console.error(
          `   Missing ${result.missingKeys.length} keys (showing first 10):`,
        );
        result.missingKeys.slice(0, 10).forEach((key) =>
          console.error(`     ${JSON.stringify(key)}`)
        );
      }

      if (result.mismatchedValues.length > 0) {
        console.error(
          `   Mismatched ${result.mismatchedValues.length} values (showing first 10):`,
        );
        result.mismatchedValues.slice(0, 10).forEach((key) =>
          console.error(`     ${JSON.stringify(key)}`)
        );
      }

      Deno.exit(1);
    }
  }
}

async function runInfo(args: Record<string, string | boolean>) {
  const file = args.file as string;

  if (!file) {
    console.error(
      `${colors.red}Error: --file is required${colors.reset}`,
    );
    Deno.exit(1);
  }

  const metadata = await readBackupMetadata(file);

  if (!metadata) {
    console.error(
      `${colors.red}Error: Could not read metadata from backup file${colors.reset}`,
    );
    Deno.exit(1);
  }

  console.log(`${colors.cyan}Backup File Information:${colors.reset}`);
  console.log(`  File: ${file}`);
  console.log(`  Total Entries: ${metadata.totalEntries}`);
  console.log(`  Source Database: ${metadata.sourceDatabase}`);
  console.log(`  Export Started: ${metadata.exportStartedAt}`);
  if (metadata.exportCompletedAt) {
    console.log(`  Export Completed: ${metadata.exportCompletedAt}`);
  }
  if (metadata.prefixFilter) {
    console.log(`  Prefix Filter: ${JSON.stringify(metadata.prefixFilter)}`);
  }
  console.log(`  Migration Tool Version: ${metadata.version}`);
}

// Main CLI entry point
if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const command = args._command as string;

  if (!command || args.help || args.h) {
    showHelp();
    Deno.exit(0);
  }

  try {
    switch (command) {
      case "export":
        await runExport(args);
        break;
      case "import":
        await runImport(args);
        break;
      case "validate":
        await runValidate(args);
        break;
      case "info":
        await runInfo(args);
        break;
      default:
        console.error(
          `${colors.red}Unknown command: ${command}${colors.reset}`,
        );
        showHelp();
        Deno.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `${colors.red}Fatal error: ${errorMessage}${colors.reset}`,
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
