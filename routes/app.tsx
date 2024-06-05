import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import Table from "@/components/Table.tsx";
import { MoneyType, PaymentType } from "@/utils/constants.ts";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div class="grid grid-cols-5 gap-4 min-h-full">
      <div class="gap-4 col-span-2 flex flex-col">
        <Card
          classes="h-2/4"
          title="Fixed expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.FIXED}
        >
          <div>
            Oi
          </div>
        </Card>
        <Card
          classes="h-2/4"
          title="Over time expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.OVER_TIME}
        >
          <div>
            Oi
          </div>
        </Card>
      </div>
      <div class="gap-4 col-span-2 flex flex-col">
        <Card
          classes="h-no-nav"
          title="Current month expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.CURRENT}
        >
          <Table />
        </Card>
      </div>
      <div class="gap-4 col-span-1 min-h-full flex flex-col">
        <Card
          classes="h-2/4"
          title="Total income"
          moneyType={MoneyType.INCOME}
        >
          <div>
            Oi
          </div>
        </Card>
        <Card
          classes="h-2/4"
          title="Total expenses"
          moneyType={MoneyType.EXPENSE}
          hideAddButton={true}
        >
          <div>
            Oi
          </div>
        </Card>
      </div>
    </div>
  );
});
