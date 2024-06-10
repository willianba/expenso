import { Handlers } from "$fresh/server.ts";
import ExpenseService, { ExpenseWithoutUser } from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";

export const handler: Handlers<ExpenseWithoutUser, SignedInState> = {
  async DELETE(_req, ctx) {
    logger.info("Deleting expense");

    const userId = ctx.state.sessionUser!.id;
    const expenseId = ctx.params.id;

    const deletedExpense = await ExpenseService.delete(userId, expenseId);
    logger.info("Expense deleted", { expense: deletedExpense.id });
    return Response.json(deletedExpense, { status: 200 });
  },
};
