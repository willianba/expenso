import { useEffect, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { formatCurrency } from "@/utils/currency.ts";
import { expenses, totalExpenses } from "@/signals/expenses.ts";
import { totalIncome } from "@/signals/income.ts";
import { Category } from "@/db/models/category.ts";
import { PaymentMethod } from "@/db/models/paymentMethod.ts";

type StatsProps = {
  children: ComponentChildren;
};

export default function Stats(props: StatsProps) {
  const { children } = props;

  return (
    <div class="w-full h-full text-center">
      <div class={`w-full h-full stats stats-vertical shadow bg-base-200`}>
        {children}
      </div>
    </div>
  );
}

export function IncomeStats() {
  return (
    <Stats>
      <div class="stat">
        <div class="stat-title">Total income</div>
        <div class="stat-value text-info">
          {formatCurrency(totalIncome.value)}
        </div>
        <div class="stat-actions">
          <button class="btn btn-sm">View & Edit</button>
        </div>
      </div>
    </Stats>
  );
}

export function ExpenseStats() {
  const [categoryMostUsed, setCategoryMostUsed] = useState("None");
  const [paymentMethodMostUsed, setPaymentMethodMostUsed] = useState("None");

  // TODO this is disgusting, refactor
  useEffect(() => {
    const result = expenses.value.reduce(
      (acc, expense) => {
        const category = expense.payment.category as Category;
        const paymentMethod = expense.payment.method as PaymentMethod;

        acc.categories[category.label] = (acc.categories[category.label] || 0) +
          1;
        acc.paymentMethods[paymentMethod.label] =
          (acc.paymentMethods[paymentMethod.label] || 0) + 1;

        if (
          acc.categories[category.label] >
            acc.categories[acc.categoryMostUsed] || !acc.categoryMostUsed
        ) {
          acc.categoryMostUsed = category.label;
        }

        if (
          acc.paymentMethods[paymentMethod.label] >
            acc.paymentMethods[acc.paymentMethodMostUsed] ||
          !acc.paymentMethodMostUsed
        ) {
          acc.paymentMethodMostUsed = paymentMethod.label;
        }

        return acc;
      },
      {
        categories: {} as Record<string, number>,
        paymentMethods: {} as Record<string, number>,
        categoryMostUsed: "",
        paymentMethodMostUsed: "",
      },
    );

    const { categoryMostUsed, paymentMethodMostUsed } = result;

    if (categoryMostUsed !== "") {
      setCategoryMostUsed(categoryMostUsed);
    } else {
      setCategoryMostUsed("None");
    }

    if (paymentMethodMostUsed !== "") {
      setPaymentMethodMostUsed(paymentMethodMostUsed);
    } else {
      setPaymentMethodMostUsed("None");
    }
  }, [expenses.value]);

  return (
    <Stats>
      <div class="stat">
        <div class="stat-title">Total spent</div>
        <div class="stat-value text-info">
          {formatCurrency(totalExpenses.value)}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">Category most used</div>
        <div class="stat-value text-info">
          {categoryMostUsed}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">Payment method most used</div>
        <div class="stat-value text-info">
          {paymentMethodMostUsed}
        </div>
      </div>
    </Stats>
  );
}

export function BalanceStats() {
  const [textStyle, setTextStyle] = useState("text-info");

  useEffect(() => {
    const balance = totalIncome.value - totalExpenses.value;

    if (balance < 0) {
      setTextStyle("text-error");
    } else if (balance === 0) {
      setTextStyle("text-warning");
    } else {
      setTextStyle("text-info");
    }
  }, [totalIncome.value, totalExpenses.value]);

  return (
    <Stats>
      <div class="stat">
        <div class="stat-title">Balance</div>
        <div class={`stat-value ${textStyle}`}>
          {formatCurrency(totalIncome.value - totalExpenses.value)}
        </div>
      </div>
    </Stats>
  );
}
