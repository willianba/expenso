import { totalExpenses } from "@/signals/expenses.ts";
import { formatCurrency } from "@/utils/currency.ts";

export default function ExpensesStats() {
  return (
    <div class="text-center">
      <div class="stats shadow bg-base-200">
        <div class="stat">
          <div class="stat-title">Total cost</div>
          <div class="stat-value text-secondary">
            {formatCurrency(totalExpenses.value)}
          </div>
          <div class="stat-desc">Total spent this month</div>
        </div>
      </div>
    </div>
  );
}
