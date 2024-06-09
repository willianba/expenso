import { useEffect } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { today } from "@/utils/date.ts";
import { RawIncome } from "@/db/models/income.ts";
import { income } from "@/signals/income.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";

export default function Loader() {
  useEffect(() => {
    const { year, month } = today();

    fetch(`/api/expenses/date?year=${year}&month=${month}`).then(
      async (res) => {
        const expensesFromThisMonth = await res.json() as ExpenseWithoutUser[];
        expenses.value = expensesFromThisMonth;
      },
    );

    fetch(`/api/income/date?year=${year}&month=${month}`).then(
      async (res) => {
        const incomeList = await res.json() as RawIncome[];
        income.value = incomeList;
      },
    );
  }, []);

  return <></>;
}
