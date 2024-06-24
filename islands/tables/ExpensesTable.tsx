import { useState } from "preact/hooks";
import { PaymentType } from "@/utils/constants.ts";
import { getSignalFromPaymentType } from "@/signals/expenses.ts";
import { getFormattedDate } from "@/utils/date.ts";
import { formatCurrency } from "@/utils/currency.ts";
import ExpenseOptionsButton from "@/islands/tables/ExpenseOptionsButton.tsx";
import { ExpenseWithoutUser } from "@/db/models/expense.ts";

type TableProps = {
  paymentType: PaymentType;
};

enum SortDirection {
  ASCENDING = "ascending",
  DESCENDING = "descending",
}

type SortKey = keyof ExpenseWithoutUser | keyof ExpenseWithoutUser["payment"];

type Sorting = {
  key: SortKey;
  direction: SortDirection;
};

export default function ExpensesTable(props: TableProps) {
  const { paymentType } = props;
  const expenses = getSignalFromPaymentType(paymentType);
  const [sortConfig, setSortConfig] = useState<Sorting>({
    key: "date",
    direction: SortDirection.ASCENDING,
  });

  const sortedExpenses = [...expenses.value].sort((a, b) => {
    let aValue = a[sortConfig.key as keyof ExpenseWithoutUser];
    let bValue = b[sortConfig.key as keyof ExpenseWithoutUser];

    // If the key is not in the expense object, it must be in the payment object
    if (!aValue && !bValue) {
      const paymentKey = sortConfig.key as keyof ExpenseWithoutUser["payment"];
      aValue = a.payment[paymentKey] as string;
      bValue = b.payment[paymentKey] as string;
    }

    if (aValue < bValue) {
      return sortConfig.direction === SortDirection.ASCENDING ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === SortDirection.ASCENDING ? 1 : -1;
    }
    return 0;
  });

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === SortDirection.ASCENDING ? "▲" : "▼";
    }
    return "";
  };

  const handleSort = (key: SortKey) => {
    let direction = SortDirection.ASCENDING;
    if (
      sortConfig.key === key && sortConfig.direction === SortDirection.ASCENDING
    ) {
      direction = SortDirection.DESCENDING;
    }
    setSortConfig({ key, direction });
  };

  return (
    <div class="overflow-y-auto h-full">
      <table class="table table-sm table-pin-rows">
        <thead>
          <tr class="[&>*]:hover:cursor-pointer bg-base-300">
            <th class="flex w-48" onClick={() => handleSort("name")}>
              <div class="flex gap-2">
                <span>Name</span>
                <span>{renderSortIcon("name")}</span>
              </div>
            </th>
            <th onClick={() => handleSort("method")}>
              <div class="flex gap-2">
                <span>Method</span>
                <span>{renderSortIcon("method")}</span>
              </div>
            </th>
            <th onClick={() => handleSort("category")}>
              <div class="flex gap-2">
                <span>Category</span>
                <span>{renderSortIcon("category")}</span>
              </div>
            </th>
            <th onClick={() => handleSort("date")}>
              <div class="flex gap-2">
                <span>Date</span>
                <span>{renderSortIcon("date")}</span>
              </div>
            </th>
            <th onClick={() => handleSort("price")}>
              <div class="flex gap-2">
                <span>Price</span>
                <span>{renderSortIcon("price")}</span>
              </div>
            </th>
            {paymentType === PaymentType.OVER_TIME && (
              <th onClick={() => handleSort("installments")}>
                <div class="flex gap-2">
                  <span>Installments</span>
                  <span>{renderSortIcon("installments")}</span>
                </div>
              </th>
            )}
            <th class="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sortedExpenses.length === 0 && (
            <tr>
              <td colSpan={6} class="text-center">
                No expenses registered
              </td>
            </tr>
          )}
          {sortedExpenses.map((expense) => (
            <tr class="hover" key={expense.id}>
              <td>{expense.name}</td>
              <td>{expense.payment.method}</td>
              <td>{expense.payment.category}</td>
              <td>{getFormattedDate(expense.payment.date)}</td>
              <td>{formatCurrency(expense.price)}</td>
              {paymentType === PaymentType.OVER_TIME && (
                <td>
                  {`${expense.payment.installment}/${expense.payment.installments}`}
                </td>
              )}
              <td>
                <ExpenseOptionsButton expense={expense} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
