import { kv } from "@/db/kv.ts";

enum Keys {
  MIGRATIONS = "migrations",
}

export const checkMigration = async (migrationName: string) => {
  const res = await kv
    .atomic()
    .check({ key: [Keys.MIGRATIONS, migrationName], versionstamp: null })
    .commit();

  if (!res.ok) {
    throw new Error(`Migration ${migrationName} already exists.`);
  }
};

export const writeMigration = async (migrationName: string) => {
  const res = await kv
    .atomic()
    .set([Keys.MIGRATIONS, migrationName], true)
    .commit();

  if (!res.ok) {
    throw new Error(`Failed to write migration ${migrationName}.`);
  }
};
