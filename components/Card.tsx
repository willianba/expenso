import { ComponentChildren } from "preact";
import AddExpenseButton from "@/islands/AddExpenseButton.tsx";
import { MoneyType, PaymentType } from "@/utils/constants.ts";

type CardProps = {
  children: ComponentChildren;
  title: string;
  moneyType: MoneyType;
  hideAddButton?: boolean;
  paymentType?: PaymentType;
  classes?: string;
};

export default function Card(props: CardProps) {
  const { classes, children, moneyType, paymentType, hideAddButton, title } =
    props;

  return (
    <div
      class={`card card-compact w-full bg-base-100 shadow-s ${classes}`}
    >
      <div class="card-body h-full">
        <div class="flex justify-between">
          <h2 class="card-title">{title}</h2>
          {!hideAddButton && (
            <AddExpenseButton moneyType={moneyType} paymentType={paymentType} />
          )}
        </div>
        <span class="divider m-0 h-2" />
        {children}
      </div>
    </div>
  );
}
