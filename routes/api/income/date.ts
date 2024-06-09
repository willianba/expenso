import { Handlers } from "$fresh/server.ts";
import { SignedInState } from "@/plugins/session.ts";
import { z } from "zod";
import IncomeService, { Income } from "@/db/models/income.ts";

const IncomeByDateSchema = z.object({
  year: z.string(),
  month: z.string().optional(),
});

export const handler: Handlers<Income, SignedInState> = {
  async GET(_req, ctx) {
    const { sessionUser } = ctx.state;
    const searchParams = Object.fromEntries(ctx.url.searchParams.entries());
    const { year, month } = IncomeByDateSchema.parse(searchParams);

    if (month) {
      const expensesByMonth = await IncomeService.getByMonth(
        sessionUser!.id,
        parseInt(year),
        parseInt(month),
      );

      return Response.json(expensesByMonth);
    }

    const expensesByYear = await IncomeService.getByYear(
      sessionUser!.id,
      parseInt(year),
    );

    return Response.json(expensesByYear);
  },
};
