import { Handlers } from "$fresh/server.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";
import IncomeService, {
  RawIncome,
  UpdateIncomeInput,
} from "@/db/models/income.ts";
import { UpdateIncomeSchema } from "@/utils/income/validators.ts";

export const handler: Handlers<RawIncome, SignedInState> = {
  async PUT(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = UpdateIncomeSchema.parse(body);
    const userId = ctx.state.sessionUser!.id;

    logger.info("Updating income");
    const updateExpenseInput: UpdateIncomeInput = {
      id: ctx.params.id,
      source: data.source,
      date: new Date(data.date),
      price: Number(data.price),
    };

    const updatedIncome = await IncomeService.update(
      userId,
      updateExpenseInput,
    );
    logger.info("Income updated", { income: updatedIncome.id });
    return Response.json(updatedIncome, { status: 200 });
  },
  async DELETE(_req, ctx) {
    const userId = ctx.state.sessionUser!.id;
    const incomeId = ctx.params.id;

    logger.info("Deleting income");
    const deletedIncome = await IncomeService.delete(userId, incomeId);
    logger.info("Income deleted", { income: deletedIncome.id });
    return Response.json(deletedIncome, { status: 200 });
  },
};
