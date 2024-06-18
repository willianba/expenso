import { load } from "@std/dotenv";
await load({ export: true });

// Function to check if a file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

// Get the migration file name from the arguments
const [migrationFileName] = Deno.args;

if (!migrationFileName) {
  console.error("Please provide the migration file name.");
  Deno.exit(1);
}

// Check if the migration file exists
const exists = await fileExists(migrationFileName);
if (!exists) {
  console.error(`Migration file ${migrationFileName} does not exist.`);
  Deno.exit(1);
}

// Run the migration file using Deno.Command
const command = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-read",
    "--allow-env",
    "--allow-net",
    "--allow-run",
    "--unstable-kv",
    migrationFileName,
  ],
  stdout: "inherit",
  stderr: "inherit",
});

const { success } = await command.output();
if (!success) {
  console.error(`Migration ${migrationFileName} failed.`);
  Deno.exit(1);
}

console.log(`Migration ${migrationFileName} completed successfully.`);
