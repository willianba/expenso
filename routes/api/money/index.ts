import { Handlers } from "$fresh/server.ts";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { z } from "zod";
import MoneyService, { CreateMoneyInput } from "@/db/models/money.ts";
import { SignedInState } from "@/plugins/session.ts";
import PaymentMethodService from "@/db/models/paymentMethod.ts";
import CategoryService from "@/db/models/category.ts";
import logger from "@/utils/logger.ts";

const EntrySchema = z.object({
  id: z.string().optional(),
  label: z.string(),
});

const CreateMoneySchema = z
  .object({
    name: z.string(),
    price: z.string(),
    moneyType: z.nativeEnum(MoneyType),
    paymentDate: z.string().date(),
    paymentMethod: z.string(),
    paymentCategory: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    installments: z.number().optional(),
  })
  .refine(
    (schema) => {
      if (schema.paymentType === PaymentType.OVER_TIME) {
        return schema.installments !== undefined;
      }
      return true;
    },
    { message: "Installments are required for payment type over time" },
  );

export const handler: Handlers<undefined, SignedInState> = {
  async POST(req, ctx) {
    const body = Object.fromEntries(await req.formData());
    const data = CreateMoneySchema.parse(body);
    logger.info("Creating money entry");
    const paymentMethod = EntrySchema.parse(JSON.parse(data.paymentMethod));
    const paymentCategory = EntrySchema.parse(JSON.parse(data.paymentCategory));

    const userId = ctx.state.sessionUser!.id;
    const createMoneyInput: CreateMoneyInput = {
      name: data.name,
      price: Number(data.price),
      type: data.moneyType,
      userId,
    };

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

    createMoneyInput.payment = {
      methodId: paymentMethodId as string,
      categoryId: categoryId as string,
      type: data.paymentType,
      date: new Date(data.paymentDate),
      installments: data.installments,
    };

    const money = await MoneyService.create(createMoneyInput);
    logger.info("Money entry created", { money: money.id });
    return new Response(JSON.stringify(money), { status: 201 });
  },
};
