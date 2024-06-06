import { Handlers } from "$fresh/server.ts";
import ExpenseService, { Expense } from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import { z } from "zod";

const ExpensesByMonthSchema = z.object({
  year: z.string(),
  month: z.string().optional(),
});

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
