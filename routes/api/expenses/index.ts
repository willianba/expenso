import { RouteHandler } from "fresh";
import { z } from "zod";
import ExpenseService, {
  ExpenseWithoutUser,
  RawExpense,
} from "@/db/models/expense.ts";
import logger from "@/utils/logger.ts";
import ExpenseInputFactory from "@/utils/expenses/factory.ts";
import { stripDate, today } from "@/utils/date.ts";
import { CreateExpenseSchema } from "@/utils/expenses/validators.ts";
import { SignedInState } from "@/utils/state.ts";

export type CreateExpenseData = z.infer<typeof CreateExpenseSchema>;

export const handler: RouteHandler<ExpenseWithoutUser, SignedInState> = {
  async POST(ctx) {
    const req = ctx.req;
    const body = Object.fromEntries(await req.formData());
    const data = CreateExpenseSchema.parse(body);

    const userId = ctx.state.sessionUser!.id;

    logger.info("Creating expense");
    const factory = new ExpenseInputFactory(data, userId);
    const inputs = await factory.build();
    const promises = inputs.map((input) => ExpenseService.create(input));
    const expenses: RawExpense[] = await Promise.all(promises);
    logger.info("Expenses created", { amount: expenses.length });

    let currentMonthExpense: RawExpense = expenses[0];
    if (expenses.length > 0) {
      const found = expenses.find((expense) => {
        const { month } = today();
        const { month: expenseMonth } = stripDate(
          new Date(expense.payment.date),
        );
        return expenseMonth === month;
      });

      if (found) {
        currentMonthExpense = found;
      }
    }

    return Response.json(currentMonthExpense, { status: 201 });
  },
};
