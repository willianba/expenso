import { useEffect, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { formatCurrency } from "@/utils/currency.ts";
import { totalExpenses } from "@/signals/expenses.ts";
import { totalIncome } from "@/signals/income.ts";
import EditIncomeButton from "@/islands/EditIncomeButton.tsx";

type StatsProps = {
  children: ComponentChildren;
};

function Stats(props: StatsProps) {
  const { children } = props;

  return (
    <div class="w-full h-full text-center">
      <div class="w-full h-full stats stats-vertical shadow-sm bg-base-200">
        {children}
      </div>
    </div>
  );
}

export function Statistics() {
  return (
    <Stats>
      <TotalIncome />
      <TotalSpent />
      <Balance />
    </Stats>
  );
}

function TotalIncome() {
  return (
    <div class="stat">
      <div class="stat-title">Total income</div>
      <div class="stat-value text-accent">
        {formatCurrency(totalIncome.value)}
      </div>
      <EditIncomeButton />
    </div>
  );
}

function TotalSpent() {
  return (
    <div class="stat">
      <div class="stat-title">Total spent</div>
      <div class="stat-value text-accent">
        {formatCurrency(totalExpenses.value)}
      </div>
    </div>
  );
}

function Balance() {
  const [textStyle, setTextStyle] = useState("text-info");

  useEffect(() => {
    const balance = totalIncome.value - totalExpenses.value;

    if (balance < 0) {
      setTextStyle("text-error");
    } else if (balance === 0) {
      setTextStyle("text-warning");
    } else {
      setTextStyle("text-success");
    }
  }, [totalIncome.value, totalExpenses.value]);

  return (
    <div class="stat">
      <div class="stat-title">Balance</div>
      <div class={`stat-value ${textStyle}`}>
        {formatCurrency(totalIncome.value - totalExpenses.value)}
      </div>
    </div>
  );
}
