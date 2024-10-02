import {
  expensesByCategory,
  expensesByPaymentMethod,
} from "@/signals/expenses.ts";
import { formatCurrency } from "@/utils/currency.ts";

export function Grouping() {
  return (
    <div class="overflow-y-auto">
      <div role="tablist" class="tabs tabs-bordered">
        <input
          type="radio"
          name="report-tabs"
          role="tab"
          class="tab whitespace-nowrap"
          aria-label="By category"
          checked={true}
        />
        <div role="tabpanel" class="tab-content pt-4">
          <table class="table table-sm table-pin-rows">
            <thead>
              <tr class="bg-base-300">
                <th class="w-48">Category</th>
                <th>% of total</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {expensesByCategory.value.length === 0 && (
                <tr>
                  <td colspan={4} class="text-center">
                    No expenses registered
                  </td>
                </tr>
              )}
              {expensesByCategory.value.map((
                [expense, { price, percentage }],
              ) => (
                <tr class="hover">
                  <td>{expense}</td>
                  <td>{`${percentage.toFixed(2)}%`}</td>
                  <td>{formatCurrency(price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <input
          type="radio"
          name="report-tabs"
          role="tab"
          class="tab whitespace-nowrap grow"
          aria-label="By payment method"
        />
        <div role="tabpanel" class="tab-content pt-4">
          <table class="table table-sm table-pin-rows">
            <thead>
              <tr class="bg-base-300">
                <th class="w-48">Payment method</th>
                <th>% of total</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {expensesByPaymentMethod.value.length === 0 && (
                <tr>
                  <td colspan={4} class="text-center">
                    No expenses registered
                  </td>
                </tr>
              )}
              {expensesByPaymentMethod.value.map((
                [expense, { price, percentage }],
              ) => (
                <tr class="hover">
                  <td>{expense}</td>
                  <td>{`${percentage.toFixed(2)}%`}</td>
                  <td>{formatCurrency(price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
