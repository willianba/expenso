import { Handlers } from "$fresh/server.ts";
import { PaymentType } from "@/utils/constants.ts";
import { z } from "zod";
import ExpenseService, {
  CreateExpenseInput,
  ExpenseWithoutUser,
} from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";
import {
  parseAndRetrieveCategory,
  parseAndRetrievePaymentMethod,
} from "@/utils/expenses.ts";

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

export const handler: Handlers<ExpenseWithoutUser, SignedInState> = {
  async POST(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = CreateExpenseSchema.parse(body);

    const userId = ctx.state.sessionUser!.id;

    const [paymentMethodId, categoryId] = await Promise.all([
      parseAndRetrievePaymentMethod(data.paymentMethod, userId),
      parseAndRetrieveCategory(data.paymentCategory, userId),
    ]);

    logger.info("Creating expense");

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
