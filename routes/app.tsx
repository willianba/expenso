import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { RouteConfig } from "$fresh/server.ts";
import Loader from "@/islands/Loader.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default defineRoute<State>((_req, _ctx) => {
  return (
    <>
      <Loader />
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
    </>
  );
});
