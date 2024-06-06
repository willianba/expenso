import { signal, computed } from "@preact/signals";
import { MoneyWithoutUser } from "@/db/models/money.ts";
import { PaymentType } from "@/utils/constants.ts";

export const moneySig = signal<MoneyWithoutUser[]>([]);

export const fixedMoneySig = computed(() => {
  return moneySig.value.filter(
    (money) => money.payment?.type === PaymentType.FIXED,
  );
});
export const overTimeMoneySig = computed(() => {
  return moneySig.value.filter(
    (money) => money.payment?.type === PaymentType.OVER_TIME,
  );
});
export const currentMonthMoneySig = computed(() => {
  return moneySig.value.filter(
    (money) => money.payment?.type === PaymentType.CURRENT,
  );
});

export function getSignalFromPaymentType(type: PaymentType) {
  switch (type) {
    case PaymentType.FIXED:
      return fixedMoneySig;
    case PaymentType.OVER_TIME:
      return overTimeMoneySig;
    case PaymentType.CURRENT:
      return currentMonthMoneySig;
    default:
      throw new Error(`Unknown payment type: ${type}`);
  }
}
