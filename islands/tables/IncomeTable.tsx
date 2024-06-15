import { getFormattedDate } from "@/utils/date.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { incomeList } from "@/signals/income.ts";
import IncomeOptionsButton from "@/islands/tables/IncomeOptionsButton.tsx";

export default function IncomeTable() {
  return (
    <div class="overflow-y-auto h-full">
      <table class="table table-sm table-pin-rows">
        <thead>
          <tr class="bg-base-300">
            <th class="w-48">Source</th>
            <th>Date</th>
            <th>Price</th>
            <th class="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {incomeList.value.length === 0 && (
            <tr>
              <td colspan={4} class="text-center">
                No income registered
              </td>
            </tr>
          )}
          {incomeList.value.map((inc) => (
            <tr class="hover">
              <td>{inc.source}</td>
              <td>{getFormattedDate(inc.date)}</td>
              <td>{formatCurrency(inc.price)}</td>
              <td>
                <IncomeOptionsButton income={inc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
