import { Handlers } from "$fresh/server.ts";
import { PaymentType } from "@/utils/constants.ts";
import { z } from "zod";
import ExpenseService, { CreateExpenseInput } from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import PaymentMethodService from "@/db/models/paymentMethod.ts";
import CategoryService from "@/db/models/category.ts";
import logger from "@/utils/logger.ts";

const EntrySchema = z.object({
  id: z.string().optional(),
  label: z.string(),
});

const CreateExpenseSchema = z
  .object({
    name: z.string(),
    price: z.string(),
    paymentDate: z.string().date(),
    paymentMethod: z.string(),
    paymentCategory: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    installments: z.string().optional(),
  })
  .refine(
    (schema) => {
      if (schema.paymentType === PaymentType.OVER_TIME) {
        return schema.installments !== undefined;
      }
      return true;
    },
    { message: "Installments are required for payments over time" },
  );

export const handler: Handlers<undefined, SignedInState> = {
  async POST(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = CreateExpenseSchema.parse(body);
    logger.info("Creating expense");
    const paymentMethod = EntrySchema.parse(JSON.parse(data.paymentMethod));
    const paymentCategory = EntrySchema.parse(JSON.parse(data.paymentCategory));

    const userId = ctx.state.sessionUser!.id;

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

    const createExpenseInput: CreateExpenseInput = {
      name: data.name,
      price: Number(data.price),
      userId,
      payment: {
        methodId: paymentMethodId!,
        categoryId: categoryId!,
        type: data.paymentType,
        date: new Date(data.paymentDate),
      },
    };

    if (data.installments) {
      const installments = Number(data.installments);
      const installmentPrice = Number(data.price) / installments;
      const promises = [];

      for (let i = 1; i <= installments; i++) {
        const date =
          i === 1
            ? new Date(data.paymentDate)
            : new Date(
                new Date(data.paymentDate).setMonth(
                  new Date(data.paymentDate).getMonth() + i - 1,
                ),
              );

        promises.push(
          ExpenseService.create({
            ...createExpenseInput,
            price: installmentPrice,
            payment: {
              ...createExpenseInput.payment,
              date,
              installment: i,
              installments,
            },
          }),
        );
      }

      const expenses = await Promise.all(promises);
      logger.info("Expenses created", { amount: expenses.length });
      const firstExpense = expenses.find(
        (expense) => expense.payment.installment === 1,
      );
      return Response.json(firstExpense, { status: 201 });
    }

    const expense = await ExpenseService.create(createExpenseInput);
    logger.info("Expense created", { expense: expense.id });
    return Response.json(expense, { status: 201 });
  },
};
