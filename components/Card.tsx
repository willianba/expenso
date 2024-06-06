import AddExpenseButton from "@/islands/AddExpenseButton.tsx";
import { PaymentType } from "@/utils/constants.ts";
import Table from "@/islands/Table.tsx";

type CardProps = {
  title: string;
  paymentType?: PaymentType;
  classes?: string;
};

export default function Card(props: CardProps) {
  const { classes, paymentType, title } = props;

  return (
    <div
      class={`card card-compact w-full bg-base-100 shadow-s ${classes}`}
    >
      <div class="card-body h-full">
        <div class="flex justify-between">
          <h2 class="card-title">{title}</h2>
          {paymentType && <AddExpenseButton paymentType={paymentType} />}
        </div>
        <span class="divider m-0 h-2" />
        {paymentType &&
          (
            <Table
              paymentType={paymentType}
            />
          )}
      </div>
    </div>
  );
}
