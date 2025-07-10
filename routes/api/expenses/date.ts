import { RouteHandler } from "fresh";
import ExpenseService, { Expense } from "@/db/models/expense.ts";
import { ExpensesByMonthSchema } from "@/utils/expenses/validators.ts";
import { SignedInState } from "@/utils/state.ts";

export const handler: RouteHandler<Expense, SignedInState> = {
  async GET(ctx) {
    const { sessionUser } = ctx.state;
    const searchParams = Object.fromEntries(ctx.url.searchParams.entries());
    const { year, month } = ExpensesByMonthSchema.parse(searchParams);

    if (month) {
      const expensesByMonth = await ExpenseService.getByMonth(
        sessionUser!.id,
        parseInt(year),
        parseInt(month),
      );

      return Response.json(expensesByMonth);
    }

    const expensesByYear = await ExpenseService.getByYear(
      sessionUser!.id,
      parseInt(year),
    );

    return Response.json(expensesByYear);
  },
};
