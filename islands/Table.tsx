import { PaymentType } from "@/utils/constants.ts";
import { getSignalFromPaymentType } from "@/signals/expenses.ts";
import { getFormattedDate } from "@/utils/date.ts";
import { formatCurrency } from "@/utils/currency.ts";

type TableProps = {
  paymentType: PaymentType;
};

export default function Table(props: TableProps) {
  const { paymentType } = props;
  const expenses = getSignalFromPaymentType(paymentType);

  return (
    <div class="overflow-y-auto">
      <table class="table table-sm table-pin-cols">
        <thead>
          <tr>
            <th>Name</th>
            <th>Method</th>
            <th>Category</th>
            <th>Date</th>
            <th>Price</th>
            {paymentType === PaymentType.OVER_TIME && <th>Installments</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.value.map((expense) => (
            <tr>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
