import { Handlers } from "$fresh/server.ts";
import { PaymentType } from "@/utils/constants.ts";
import { z } from "zod";
import ExpenseService, {
  ExpenseWithoutUser,
  RawExpense,
} from "@/db/models/expense.ts";
import { SignedInState } from "@/plugins/session.ts";
import logger from "@/utils/logger.ts";
import ExpenseInputFactory from "@/utils/expenses/factory.ts";
import { stripDate, today } from "@/utils/date.ts";

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

export type CreateExpenseData = z.infer<typeof CreateExpenseSchema>;

export const handler: Handlers<ExpenseWithoutUser, SignedInState> = {
  async POST(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = CreateExpenseSchema.parse(body);

    const userId = ctx.state.sessionUser!.id;

    logger.info("Creating expense");
    const factory = new ExpenseInputFactory(data, userId);
    const inputs = await factory.build();
    const promises = inputs.map((input) => ExpenseService.create(input));
    const expenses: RawExpense[] = await Promise.all(promises);
    logger.info("Expenses created", { amount: expenses.length });

    let currentMonthExpense: RawExpense = expenses[0];
    if (expenses.length > 0) {
      const found = expenses.find((expense) => {
        const { month } = today();
        const { month: expenseMonth } = stripDate(
          new Date(expense.payment.date),
        );
        return expenseMonth === month;
      });

      if (found) {
        currentMonthExpense = found;
      }
    }

    return Response.json(currentMonthExpense, { status: 201 });
  },
};
