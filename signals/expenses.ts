import { computed, Signal, signal } from "@preact/signals";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { PaymentType } from "@/utils/constants.ts";
import { stripDate } from "@/utils/date.ts";
import { activeMonth } from "@/signals/menu.ts";

export const expenses = signal<ExpenseWithoutUser[]>([]);

export const expensesByCategory = computed(() => {
  const mappedExpenses = expenses.value.reduce((acc, expense) => {
    const category = expense.payment.category;
    const updatedPrice = (acc.get(category)?.price || 0) + expense.price;
    const percentage = (updatedPrice / totalExpenses.value) * 100;
    acc.set(category, {
      price: updatedPrice,
      percentage,
    });
    return acc;
  }, new Map<string, { price: number; percentage: number }>());

  return Array.from(mappedExpenses.entries()).sort(
    (a, b) => b[1].price - a[1].price,
  );
});

export const expensesByPaymentMethod = computed(() => {
  const mappedExpenses = expenses.value.reduce((acc, expense) => {
    const paymentMethod = expense.payment.method;
    const updatedPrice = (acc.get(paymentMethod)?.price || 0) + expense.price;
    const percentage = (updatedPrice / totalExpenses.value) * 100;
    acc.set(paymentMethod, {
      price: updatedPrice,
      percentage,
    });
    return acc;
  }, new Map<string, { price: number; percentage: number }>());

  return Array.from(mappedExpenses.entries()).sort(
    (a, b) => b[1].price - a[1].price,
  );
});

const filterExpensesByType = (type: PaymentType) => {
  return computed(() => {
    return expenses.value.filter(
      (expense) =>
        stripDate(new Date(expense.payment.date)).month === activeMonth.value &&
        expense.payment.type === type,
    );
  });
};

const computeTotal = (expenseSignal: Signal<ExpenseWithoutUser[]>) => {
  return computed(() => {
    return expenseSignal.value.reduce((acc, expense) => acc + expense.price, 0);
  });
};

const fixedExpenses = filterExpensesByType(PaymentType.FIXED);
const overTimeExpenses = filterExpensesByType(PaymentType.OVER_TIME);
const currentMonthExpenses = filterExpensesByType(PaymentType.CURRENT);

export const totalFixedExpenses = computeTotal(fixedExpenses);
export const totalOverTimeExpenses = computeTotal(overTimeExpenses);
export const totalCurrentMonthExpenses = computeTotal(currentMonthExpenses);
export const totalExpenses = computed(() => {
  return (
    totalFixedExpenses.value +
    totalOverTimeExpenses.value +
    totalCurrentMonthExpenses.value
  );
});

export function getSignalFromPaymentType(type: PaymentType) {
  switch (type) {
    case PaymentType.FIXED:
      return fixedExpenses;
    case PaymentType.OVER_TIME:
      return overTimeExpenses;
    case PaymentType.CURRENT:
      return currentMonthExpenses;
    default:
      throw new Error(`Unknown payment type: ${type}`);
  }
}
