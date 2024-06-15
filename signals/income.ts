import { computed, signal } from "@preact/signals";
import { RawIncome } from "@/db/models/income.ts";

export const incomeList = signal<RawIncome[]>([]);
export const totalIncome = computed(() => {
  return incomeList.value.reduce((acc, income) => acc + income.price, 0);
});
