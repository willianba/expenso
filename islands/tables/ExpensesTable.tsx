import { PaymentType } from "@/utils/constants.ts";
import { getSignalFromPaymentType } from "@/signals/expenses.ts";
import { getFormattedDate } from "@/utils/date.ts";
import { formatCurrency } from "@/utils/currency.ts";
import ExpenseOptionsButton from "@/islands/tables/ExpenseOptionsButton.tsx";

type TableProps = {
  paymentType: PaymentType;
};

export default function ExpensesTable(props: TableProps) {
  const { paymentType } = props;
  const expenses = getSignalFromPaymentType(paymentType);

  return (
    <div class="overflow-y-auto h-full">
      <table class="table table-sm table-pin-rows">
        <thead>
          <tr class="bg-base-300">
            <th class="w-48">Name</th>
            <th>Method</th>
            <th>Category</th>
            <th>Date</th>
            <th>Price</th>
            {paymentType === PaymentType.OVER_TIME && <th>Installments</th>}
            <th class="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.value.length === 0 && (
            <tr>
              <td colspan={6} class="text-center">
                No expenses registered
              </td>
            </tr>
          )}
          {expenses.value.map((expense) => (
            <tr class="hover">
              <td>{expense.name}</td>
              <td>{expense.payment.method}</td>
              <td>{expense.payment.category}</td>
              <td>
                {getFormattedDate(expense.payment.date)}
              </td>
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
