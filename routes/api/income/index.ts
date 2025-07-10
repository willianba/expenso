import { RouteHandler } from "fresh";
import IncomeService, { Income } from "@/db/models/income.ts";
import logger from "@/utils/logger.ts";
import { CreateIncomeSchema } from "@/utils/income/validators.ts";
import { SignedInState } from "@/utils/state.ts";

export const handler: RouteHandler<Income, SignedInState> = {
  async POST(ctx) {
    const req = ctx.req;
    const body = Object.fromEntries(await req.formData());
    const { source, price, date } = CreateIncomeSchema.parse(body);

    logger.info("Creating income");
    const income = await IncomeService.create({
      userId: ctx.state.sessionUser!.id,
      source,
      date: new Date(date),
      price: Number(price),
    });

    logger.info("Income created", { id: income.id });
    return Response.json(income);
  },
};
