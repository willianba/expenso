import { Handlers } from "$fresh/server.ts";
import ExpenseService, {
  ExpenseWithoutUser,
  UpdateExpenseInput,
} from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";
import { z } from "zod";
import PaymentMethodService from "@/db/models/paymentMethod.ts";
import CategoryService from "@/db/models/category.ts";
import { EntrySchema } from "@/routes/api/expenses/index.ts";

const UpdateExpenseSchema = z.object({
  name: z.string(),
  paymentDate: z.string().date(),
  paymentMethod: z.string(),
  paymentCategory: z.string(),
  price: z.string().optional(),
});

export const handler: Handlers<ExpenseWithoutUser, SignedInState> = {
  async PUT(req, ctx) {
    logger.info("Updating expense");

    const body = Object.fromEntries(await req.formData());
    const data = UpdateExpenseSchema.parse(body);
    const paymentMethod = EntrySchema.parse(JSON.parse(data.paymentMethod));
    const paymentCategory = EntrySchema.parse(JSON.parse(data.paymentCategory));

    const userId = ctx.state.sessionUser!.id;
    const expenseId = ctx.params.id;

    let paymentMethodId = paymentMethod.id;
    if (!paymentMethod.id) {
      logger.info("Creating payment method", {
        user: userId,
        paymentMethod: paymentMethod.label,
      });
      const newPaymentMethod = await PaymentMethodService.create({
        label: paymentMethod.label,
        userId,
      });
      paymentMethodId = newPaymentMethod.id;
    }

    let categoryId = paymentCategory.id;
    if (!paymentCategory.id) {
      logger.info("Creating category", {
        user: userId,
        category: paymentCategory.label,
      });
      const category = await CategoryService.create({
        label: paymentCategory.label,
        userId,
      });
      categoryId = category.id;
    }

    const updateExpenseInput: UpdateExpenseInput = {
      id: expenseId,
      name: data.name,
      payment: {
        methodId: paymentMethodId,
        categoryId: categoryId,
        date: new Date(data.paymentDate),
      },
      ...(data.price ? { price: Number(data.price) } : {}),
    };

    const updatedExpense = await ExpenseService.update(
      userId,
      updateExpenseInput,
    );
    logger.info("Expense updated", { expense: updatedExpense.id });
    return Response.json(updatedExpense, { status: 200 });
  },
  async DELETE(_req, ctx) {
    logger.info("Deleting expense");

    const userId = ctx.state.sessionUser!.id;
    const expenseId = ctx.params.id;

    const deletedExpense = await ExpenseService.delete(userId, expenseId);
    logger.info("Expense deleted", { expense: deletedExpense.id });
    return Response.json(deletedExpense, { status: 200 });
  },
};
