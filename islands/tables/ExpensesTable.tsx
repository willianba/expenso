import { PaymentType } from "@/utils/constants.ts";
import { getSignalFromPaymentType } from "@/signals/expenses.ts";
import { getFormattedDate } from "@/utils/date.ts";
import { formatCurrency } from "@/utils/currency.ts";

type TableProps = {
  paymentType: PaymentType;
};

export default function ExpensesTable(props: TableProps) {
  const { paymentType } = props;
  const expenses = getSignalFromPaymentType(paymentType);

  return (
    <div class="overflow-y-auto">
      <table class="table table-sm table-pin-rows">
        <thead>
          <tr class="hover">
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
          {expenses.value.map((expense) => (
            <tr class="hover">
              <td>{expense.name}</td>
              <td>{expense.payment.method.label}</td>
              <td>{expense.payment.category.label}</td>
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
                <button class="flex btn btn-xs btn-ghost">
                  <svg
                    class="w-5 h-5 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 12a2 2 0 100-4 2 2 0 000 4zM8 12a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}