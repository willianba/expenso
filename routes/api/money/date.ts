import { Handlers } from "$fresh/server.ts";
import MoneyService, { Money } from "@/db/models/money.ts";
import { SignedInState } from "@/plugins/session.ts";
import { z } from "zod";

const MoneyByMonthSchema = z.object({
  year: z.string(),
  month: z.string().optional(),
});

export const handler: Handlers<Money, SignedInState> = {
  async GET(_req, ctx) {
    const { sessionUser } = ctx.state;
    const searchParams = Object.fromEntries(ctx.url.searchParams.entries());
    const { year, month } = MoneyByMonthSchema.parse(searchParams);

    if (month) {
      const moneyByMonth = await MoneyService.getByMonth(
        sessionUser!.id,
        parseInt(year),
        parseInt(month),
      );

      return Response.json(moneyByMonth);
    }

    const moneyByYear = await MoneyService.getByYear(
      sessionUser!.id,
      parseInt(year),
    );

    return Response.json(moneyByYear);
  },
};
