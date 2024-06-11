import { useEffect } from "preact/hooks";
import { expenses } from "@/signals/expenses.ts";
import { today } from "@/utils/date.ts";
import { RawIncome } from "@/db/models/income.ts";
import { income } from "@/signals/income.ts";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { CategoryWithoutUser } from "@/db/models/category.ts";
import { categories, paymentMethods } from "@/signals/inputData.ts";
import { PaymentMethodWithoutUser } from "@/db/models/paymentMethod.ts";

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

        const incomeList = await res.json() as RawIncome[];
        income.value = incomeList;
      },
    );

    fetch("/api/categories").then(async (res) => {
      if (!res.ok) {
        // TODO show error message
        return;
      }

      const categoryList = await res.json() as CategoryWithoutUser[];
      categoryList.sort((a, b) => a.label.localeCompare(b.label));
      categories.value = categoryList;
    });

    fetch("/api/paymentMethods").then(async (res) => {
      if (!res.ok) {
        // TODO show error message
        return;
      }

      const paymentMethodList = await res.json() as PaymentMethodWithoutUser[];
      paymentMethodList.sort((a, b) => a.label.localeCompare(b.label));
      paymentMethods.value = paymentMethodList;
    });
  }, []);

  return <></>;
}
