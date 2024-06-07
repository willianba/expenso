import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { PaymentType } from "@/utils/constants.ts";
import { RouteConfig } from "$fresh/server.ts";
import Loader from "@/islands/Loader.tsx";
import AddExpenseButton from "@/islands/AddExpenseButton.tsx";
import Table from "@/islands/Table.tsx";
import { totalExpenses } from "@/signals/expenses.ts";
import ExpensesStats from "@/islands/ExpensesStats.tsx";

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
            title="Fixed"
            actionButton={<AddExpenseButton paymentType={PaymentType.FIXED} />}
          >
            <Table
              paymentType={PaymentType.FIXED}
            />
          </Card>
          <Card
            classes="h-2/4"
            title="Over time"
            actionButton={
              <AddExpenseButton paymentType={PaymentType.OVER_TIME} />
            }
          >
            <Table
              paymentType={PaymentType.OVER_TIME}
            />
          </Card>
        </div>
        <div class="gap-4 col-span-2 flex flex-col">
          <Card
            classes="h-no-nav"
            title="Current month"
            actionButton={
              <AddExpenseButton paymentType={PaymentType.CURRENT} />
            }
          >
            <Table
              paymentType={PaymentType.CURRENT}
            />
          </Card>
        </div>
        <div class="gap-4 col-span-1 min-h-full flex flex-col">
          <Card
            classes="h-2/4"
            title="Total income"
          >
            Oi
          </Card>
          <Card
            classes="h-2/4"
            title="Total expenses"
          >
            <ExpensesStats />
          </Card>
        </div>
      </div>
    </>
  );
});
