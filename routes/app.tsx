import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { PaymentType } from "@/utils/constants.ts";
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
            paymentType={PaymentType.FIXED}
          />
          <Card
            classes="h-2/4"
            title="Over time expenses"
            paymentType={PaymentType.OVER_TIME}
          />
        </div>
        <div class="gap-4 col-span-2 flex flex-col">
          <Card
            classes="h-no-nav"
            title="Current month expenses"
            paymentType={PaymentType.CURRENT}
          />
        </div>
        <div class="gap-4 col-span-1 min-h-full flex flex-col">
          <Card
            classes="h-2/4"
            title="Total income"
          />
          <Card
            classes="h-2/4"
            title="Total expenses"
          />
        </div>
      </div>
    </>
  );
});
