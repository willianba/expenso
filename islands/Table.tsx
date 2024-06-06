import { PaymentType } from "@/utils/constants.ts";
import { getSignalFromPaymentType } from "@/signals/money.ts";
import { getFormattedDate } from "@/utils/date.ts";

type TableProps = {
  paymentType: PaymentType;
};

export default function Table(props: TableProps) {
  const { paymentType } = props;
  const dataSignal = getSignalFromPaymentType(paymentType);

  return (
    <div class="overflow-y-auto">
      <table class="table table-xs table-pin-cols">
        <thead>
          <tr>
            <th>Name</th>
            <th>Method</th>
            <th>Category</th>
            <th>Date</th>
            <th>Price</th>
            {paymentType === PaymentType.OVER_TIME && <th>Installments #</th>}
          </tr>
        </thead>
        <tbody>
          {dataSignal.value.map((money) => (
            <tr>
              <td>{money.name}</td>
              <td>{money.payment.method.label}</td>
              <td>{money.payment.category.label}</td>
              <td>{money.payment.date}</td>
              <td>{money.price}</td>
              {paymentType === PaymentType.OVER_TIME && (
                <td>{money.payment.installments}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
