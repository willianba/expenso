import { Handlers } from "$fresh/server.ts";
import ExpenseService, {
  ExpenseWithoutUser,
  UpdateExpenseInput,
} from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";
import { z } from "zod";
import PaymentMethodService from "@/db/models/payment-method.ts";
import CategoryService from "@/db/models/category.ts";

const UpdateExpenseSchema = z.object({
  name: z.string(),
  paymentDate: z.string().date(),
  paymentMethod: z.string(),
  paymentCategory: z.string(),
  price: z.string().optional(),
  propagate: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const DeleteExpenseSchema = z.object({
  propagate: z.boolean().optional().default(false),
});

export const handler: Handlers<ExpenseWithoutUser, SignedInState> = {
  async PUT(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = UpdateExpenseSchema.parse(body);

    logger.info("Updating expense");
    const userId = ctx.state.sessionUser!.id;

    const [paymentMethod, category] = await Promise.all([
      PaymentMethodService.findOrCreate({
        label: data.paymentMethod.trim(),
        userId: userId,
      }),
      CategoryService.findOrCreate({
        label: data.paymentCategory.trim(),
        userId: userId,
      }),
    ]);

    const updateExpenseInput: UpdateExpenseInput = {
      id: ctx.params.id,
      name: data.name,
      payment: {
        method: paymentMethod.label,
        category: category.label,
        date: new Date(data.paymentDate),
      },
      ...(data.price ? { price: Number(data.price) } : {}),
    };

    const updatedExpense = await ExpenseService.update(
      userId,
      updateExpenseInput,
      data.propagate,
    );
    logger.info("Expense updated", { expense: updatedExpense.id });
    return Response.json(updatedExpense, { status: 200 });
  },
  async DELETE(req, ctx) {
    const data = DeleteExpenseSchema.parse(await req.json());

    logger.info("Deleting expense");

    const userId = ctx.state.sessionUser!.id;
    const expenseId = ctx.params.id;

    const deletedExpense = await ExpenseService.delete(
      userId,
      expenseId,
      data.propagate,
    );
    logger.info("Expense deleted", { expense: deletedExpense.id });
    return Response.json(deletedExpense, { status: 200 });
  },
};
