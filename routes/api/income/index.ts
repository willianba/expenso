import { Handlers } from "$fresh/server.ts";
import { SignedInState } from "@/plugins/session.ts";
import IncomeService, { Income } from "@/db/models/income.ts";
import { z } from "zod";
import logger from "@/utils/logger.ts";

const CreateIncomeSchema = z.object({
  source: z.string(),
  date: z.string().date(),
  price: z.string(),
});

export const handler: Handlers<Income, SignedInState> = {
  async POST(req, ctx) {
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
