import { RouteHandler } from "fresh";
import IncomeService, { Income } from "@/db/models/income.ts";
import { IncomeByDateSchema } from "@/utils/income/validators.ts";
import { SignedInState } from "@/utils/state.ts";

export const handler: RouteHandler<Income, SignedInState> = {
  async GET(ctx) {
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
