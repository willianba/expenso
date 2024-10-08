import { defineRoute } from "$fresh/server.ts";
import { State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { PaymentType } from "@/utils/constants.ts";
import { RouteConfig } from "$fresh/server.ts";
import Loader from "@/islands/Loader.tsx";
import AddExpenseButton from "@/islands/AddExpenseButton.tsx";
import ExpensesTable from "@/islands/tables/ExpensesTable.tsx";
import AddIncomeButton from "@/islands/AddIncomeButton.tsx";
import { Statistics } from "@/islands/Stats.tsx";
import {
  CurrentMonthCardTitle,
  FixedCardTitle,
  OverTimeCardTitle,
} from "@/islands/CardTitle.tsx";
import { Grouping } from "@/islands/Grouping.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default defineRoute<State>((_req, _ctx) => {
  return (
    <>
      <Loader />
      <div class="grid grid-cols-5 grid-rows-10 gap-4 h-full max-h-full">
        <div class="col-span-2 row-span-5">
          <Card
            title={<FixedCardTitle />}
            actionButton={<AddExpenseButton paymentType={PaymentType.FIXED} />}
          >
            <ExpensesTable
              paymentType={PaymentType.FIXED}
            />
          </Card>
        </div>
        <div class="col-span-2 row-span-5 col-start-1 row-start-6">
          <Card
            title={<OverTimeCardTitle />}
            actionButton={
              <AddExpenseButton paymentType={PaymentType.OVER_TIME} />
            }
          >
            <ExpensesTable
              paymentType={PaymentType.OVER_TIME}
            />
          </Card>
        </div>
        <div class="col-span-2 row-span-10 col-start-3 row-start-1">
          <Card
            title={<CurrentMonthCardTitle />}
            actionButton={
              <AddExpenseButton paymentType={PaymentType.CURRENT} />
            }
          >
            <ExpensesTable
              paymentType={PaymentType.CURRENT}
            />
          </Card>
        </div>
        <div class="col-span-1 row-span-5 col-start-5 row-start-1">
          <Card
            title="Statistics"
            actionButton={<AddIncomeButton />}
          >
            <Statistics />
          </Card>
        </div>
        <div class="col-span-1 row-span-5 col-start-5 row-start-6">
          <Card title="Grouping">
            <Grouping />
          </Card>
        </div>
      </div>
    </>
  );
});
