import { z } from "zod";

export const UpdateIncomeSchema = z.object({
  source: z.string(),
  date: z.string().date(),
  price: z.string(),
});

export const IncomeByDateSchema = z.object({
  year: z.string(),
  month: z.string().optional(),
});

export const CreateIncomeSchema = z.object({
  source: z.string(),
  date: z.string().date(),
  price: z.string(),
});
