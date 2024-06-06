import { signal, computed } from "@preact/signals";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { PaymentType } from "@/utils/constants.ts";

export const expenses = signal<ExpenseWithoutUser[]>([]);

export const fixedExpenses = computed(() => {
  return expenses.value.filter(
    (expense) => expense.payment.type === PaymentType.FIXED,
  );
});
export const overTimeExpenses = computed(() => {
  return expenses.value.filter(
    (expense) => expense.payment.type === PaymentType.OVER_TIME,
  );
});
export const currentMonthExpenses = computed(() => {
  return expenses.value.filter(
    (expense) => expense.payment.type === PaymentType.CURRENT,
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
