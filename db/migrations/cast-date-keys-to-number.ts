import { kv } from "@/db/kv.ts";
import { checkMigration, writeMigration } from "@/db/migration-checker.ts";
import { RawIncome } from "@/db/models/income.ts";
import { RawExpense } from "@/db/models/expense.ts";

const migrationName = "cast-date-keys-to-number";
await checkMigration(migrationName);

const incomeIterator = kv.list<RawIncome>({ prefix: ["income_by_date"] });
const incomeList = await Array.fromAsync(
  incomeIterator,
  (entry) => entry.value,
);

for (const income of incomeList) {
  const newYearKey = income.date.getFullYear();
  const newMonthKey = income.date.getMonth() + 1;

  const newKey = [
    "income_by_date",
    income.userId,
    newYearKey,
    newMonthKey,
    income.id,
  ];
  const oldKey = [
    "income_by_date",
    income.userId,
    income.date.getFullYear().toString(),
    (income.date.getMonth() + 1).toString(),
    income.id,
  ];

  await kv.atomic().delete(oldKey).set(newKey, income).commit();
}

const expenseIterator = kv.list<RawExpense>({ prefix: ["expenses_by_date"] });
const expenseList = await Array.fromAsync(
  expenseIterator,
  (entry) => entry.value,
);

for (const expense of expenseList) {
  const newYearKey = expense.payment.date.getFullYear();
  const newMonthKey = expense.payment.date.getMonth() + 1;

  const newKey = [
    "expenses_by_date",
    expense.userId,
    newYearKey,
    newMonthKey,
    expense.id,
  ];
  const oldKey = [
    "expenses_by_date",
    expense.userId,
    expense.payment.date.getFullYear().toString(),
    (expense.payment.date.getMonth() + 1).toString(),
    expense.id,
  ];

  await kv.atomic().delete(oldKey).set(newKey, expense).commit();
}

await writeMigration(migrationName);
