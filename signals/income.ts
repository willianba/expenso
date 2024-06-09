import { computed, signal } from "@preact/signals";
import { RawIncome } from "@/db/models/income.ts";

export const income = signal<RawIncome[]>([]);
export const totalIncome = computed(() => {
  return income.value.reduce((acc, income) => acc + income.price, 0);
});
