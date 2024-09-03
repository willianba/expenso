import { kv } from "@/db/kv.ts";
import { RawIncome } from "@/db/models/income.ts";
import { checkMigration, writeMigration } from "@/db/migration-checker.ts";

const migrationName = "remove-unnecessary-keys";

await checkMigration(migrationName);

const indexes = [
  ["income", "income_by_user"],
  ["expenses", "expenses_by_user"],
  ["categories", "categories_by_user"],
  ["payment_methods", "payment_methods_by_user"],
];

for (const index of indexes) {
  const newKey = index[0];
  const oldKey = index[1];
  const allIterator = kv.list({ prefix: [newKey] });
  const byUserIterator = kv.list({
    prefix: [oldKey],
  });

  const deleteOperations = kv.atomic();

  for await (const entry of allIterator) {
    deleteOperations.delete(entry.key);
  }

  const deleteRes = await deleteOperations.commit();

  if (!deleteRes.ok) {
    console.error("Failed to delete data.");
    Deno.exit(1);
  }

  const addOperations = kv.atomic();

  for await (
    const entry of kv.list<RawIncome>({
      prefix: [oldKey],
    })
  ) {
    const income = entry.value;
    addOperations.set([newKey, income.userId, income.id], income);
  }

  for await (const entry of byUserIterator) {
    addOperations.delete(entry.key);
  }

  const res = await addOperations.commit();

  if (!res.ok) {
    console.error("Failed to update data.");
    Deno.exit(1);
  }
}

await writeMigration(migrationName);
