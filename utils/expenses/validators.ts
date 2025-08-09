import { z } from "zod";
import { PaymentType } from "@/utils/constants.ts";

export const ExpensesByMonthSchema = z.object({
  year: z.string(),
  month: z.string().optional(),
});

export const CreateExpenseSchema = z
  .object({
    name: z.string(),
    price: z.string(),
    paymentDate: z.string().date(),
    paymentMethod: z.string(),
    paymentCategory: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    installments: z.string().optional(),
    timezoneOffset: z.string().transform((v) => parseInt(v, 10)),
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

export const UpdateExpenseSchema = z.object({
  name: z.string(),
  paymentDate: z.string().date(),
  paymentMethod: z.string(),
  paymentCategory: z.string(),
  price: z.string().optional(),
  timezoneOffset: z.string().transform((v) => parseInt(v, 10)),
  propagate: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const DeleteExpenseSchema = z.object({
  propagate: z.boolean().optional().default(false),
});
