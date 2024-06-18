import { useEffect } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { today } from "@/utils/date.ts";
import { RawIncome } from "@/db/models/income.ts";
import { incomeList } from "@/signals/income.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { CategoryWithoutUser } from "@/db/models/category.ts";
import { categories, paymentMethods } from "@/signals/input-data.ts";
import { PaymentMethodWithoutUser } from "@/db/models/payment-method.ts";

export default function Loader() {
  useEffect(() => {
    const { year, month } = today();

    fetch(`/api/expenses/date?year=${year}&month=${month}`).then(
      async (res) => {
        if (!res.ok) {
          // TODO show error message
          return;
        }

        const expensesFromThisMonth = await res.json() as ExpenseWithoutUser[];
        expenses.value = expensesFromThisMonth;
      },
    );

    fetch(`/api/income/date?year=${year}&month=${month}`).then(
      async (res) => {
        if (!res.ok) {
          // TODO show error message
          return;
        }

        const income = await res.json() as RawIncome[];
        incomeList.value = income;
      },
    );

    fetch("/api/categories").then(async (res) => {
      if (!res.ok) {
        // TODO show error message
        return;
      }

      const categoryList = await res.json() as CategoryWithoutUser[];
      const labels = categoryList.sort((a, b) => a.label.localeCompare(b.label))
        .map((c) => c.label);
      categories.value = labels;
    });

    fetch("/api/paymentMethods").then(async (res) => {
      if (!res.ok) {
        // TODO show error message
        return;
      }

      const paymentMethodList = await res.json() as PaymentMethodWithoutUser[];
      const labels = paymentMethodList.sort((a, b) =>
        a.label.localeCompare(b.label)
      ).map((pm) => pm.label);
      paymentMethods.value = labels;
    });
  }, []);

  return <></>;
}
