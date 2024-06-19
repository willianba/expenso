import { computed, signal } from "@preact/signals";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { PaymentType } from "@/utils/constants.ts";
import { stripDate } from "@/utils/date.ts";
import { activeMonth } from "@/signals/menu.ts";
import { SignalLike } from "$fresh/src/types.ts";

export const expenses = signal<ExpenseWithoutUser[]>([]);

const filterExpensesByType = (type: PaymentType) => {
  return computed(() => {
    return expenses.value.filter(
      (expense) =>
        stripDate(new Date(expense.payment.date)).month === activeMonth.value &&
        expense.payment.type === type,
    );
  });
};

export const fixedExpenses = filterExpensesByType(PaymentType.FIXED);
export const overTimeExpenses = filterExpensesByType(PaymentType.OVER_TIME);
export const currentMonthExpenses = filterExpensesByType(PaymentType.CURRENT);

const computeTotal = (expenseSignal: SignalLike<ExpenseWithoutUser[]>) => {
  return computed(() => {
    return expenseSignal.value.reduce((acc, expense) => acc + expense.price, 0);
  });
};

export const totalFixedExpenses = computeTotal(fixedExpenses);
export const totalOverTimeExpenses = computeTotal(overTimeExpenses);
export const totalCurrentMonthExpenses = computeTotal(currentMonthExpenses);

export const totalExpenses = computed(() => {
  return expenses.value
    .filter(
      (expense) =>
        stripDate(new Date(expense.payment.date)).month === activeMonth.value,
    )
    .reduce((acc, expense) => acc + expense.price, 0);
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
