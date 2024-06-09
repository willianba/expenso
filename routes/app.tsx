import { defineRoute } from "$fresh/server.ts";
import { State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import { PaymentType } from "@/utils/constants.ts";
import { RouteConfig } from "$fresh/server.ts";
import Loader from "@/islands/Loader.tsx";
import AddExpenseButton from "@/islands/AddExpenseButton.tsx";
import ExpensesTable from "@/islands/tables/ExpensesTable.tsx";
import AddIncomeButton from "@/islands/AddIncomeButton.tsx";
import { BalanceStats, ExpenseStats, IncomeStats } from "@/islands/Stats.tsx";
import {
  CurrentMonthCardTitle,
  FixedCardTitle,
  OverTimeCardTitle,
} from "@/islands/CardTitle.tsx";

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
            title={<FixedCardTitle />}
            actionButton={<AddExpenseButton paymentType={PaymentType.FIXED} />}
          >
            <ExpensesTable
              paymentType={PaymentType.FIXED}
            />
          </Card>
          <Card
            classes="h-2/4"
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
        <div class="gap-4 col-span-2 flex flex-col">
          <Card
            classes="h-no-nav"
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
        <div class="gap-4 col-span-1 min-h-full flex flex-col">
          <Card
            title="Income"
            actionButton={<AddIncomeButton />}
          >
            <IncomeStats />
          </Card>
          <Card
            classes="flex-grow"
            title="Expenses"
          >
            <ExpenseStats />
          </Card>
          <Card
            classes="flex-grow"
            title="Balance"
          >
            <BalanceStats />
          </Card>
        </div>
      </div>
    </>
  );
});
