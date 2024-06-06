import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { moneySig } from "@/signals/money.ts";
import MoneyService from "@/db/models/money.ts";
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default defineRoute<State>(async (_req, ctx) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const moneyFromThisMonth = await MoneyService.getByMonth(
    ctx.state.sessionUser!.id,
    year,
    month,
  );
  moneySig.value = moneyFromThisMonth;
  // TODO move this to a real-time signal somehow
  // this is not 100% working because this is rendered in the server

  return (
    <div class="grid grid-cols-5 gap-4 min-h-full">
      <div class="gap-4 col-span-2 flex flex-col">
        <Card
          classes="h-2/4"
          title="Fixed expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.FIXED}
        />
        <Card
          classes="h-2/4"
          title="Over time expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.OVER_TIME}
        />
      </div>
      <div class="gap-4 col-span-2 flex flex-col">
        <Card
          classes="h-no-nav"
          title="Current month expenses"
          moneyType={MoneyType.EXPENSE}
          paymentType={PaymentType.CURRENT}
        />
      </div>
      <div class="gap-4 col-span-1 min-h-full flex flex-col">
        <Card
          classes="h-2/4"
          title="Total income"
          moneyType={MoneyType.INCOME}
        />
        <Card
          classes="h-2/4"
          title="Total expenses"
          moneyType={MoneyType.EXPENSE}
        />
      </div>
    </div>
  );
});
