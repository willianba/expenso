import { SignalLike } from "$fresh/src/types.ts";
import {
  totalCurrentMonthExpenses,
  totalFixedExpenses,
  totalOverTimeExpenses,
} from "@/signals/expenses.ts";
import { formatCurrency } from "@/utils/currency.ts";

type CardTitleProps = {
  title: string;
  signal: SignalLike<number>;
};

function CardTitle(props: CardTitleProps) {
  const { title, signal } = props;

  return (
    <div class="flex items-center">
      <h2 class="card-title">{title}</h2>
      <div class="divider divider-horizontal" />
      <span class="text-accent">{formatCurrency(signal.value)}</span>
    </div>
  );
}

export function FixedCardTitle() {
  return <CardTitle title="Fixed" signal={totalFixedExpenses} />;
}

export function OverTimeCardTitle() {
  return <CardTitle title="Over time" signal={totalOverTimeExpenses} />;
}

export function CurrentMonthCardTitle() {
  return <CardTitle title="Current month" signal={totalCurrentMonthExpenses} />;
}
