import { formatCurrency } from "@/utils/currency.ts";
import { SignalLike } from "$fresh/src/types.ts";
import { totalExpenses } from "@/signals/expenses.ts";
import { totalIncome } from "@/signals/income.ts";

type StatsProps = {
  title: string;
  signal: SignalLike<number>;
};

export default function Stats(props: StatsProps) {
  const { signal, title } = props;

  return (
    <div class="text-center">
      <div class="stats shadow bg-base-200">
        <div class="stat">
          <div class="stat-title">{title}</div>
          <div class="stat-value text-info">
            {formatCurrency(signal.value)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpenseStats() {
  return <Stats title="Total spent" signal={totalExpenses} />;
}

export function IncomeStats() {
  return <Stats title="Total received" signal={totalIncome} />;
}
