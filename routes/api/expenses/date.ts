import { Handlers } from "$fresh/server.ts";
import ExpenseService, { Expense } from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import { ExpensesByMonthSchema } from "@/utils/expenses/validators.ts";

export const handler: Handlers<Expense, SignedInState> = {
  async GET(_req, ctx) {
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
