import { FreshContext, Handlers } from "$fresh/server.ts";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { z } from "zod";
import MoneyService, { CreateMoneyInput, RawMoney } from "@/db/models/money.ts";
import { SignedInState, State } from "@/plugins/session.ts";
import PaymentMethodService from "@/db/models/paymentMethod.ts";
import CategoryService from "@/db/models/category.ts";
import logger from "@/utils/logger.ts";
import { getFormattedDate } from "@/utils/date.ts";

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

    const createMoneyInput: CreateMoneyInput = {
      name: data.name,
      price: Number(data.price),
      type: data.moneyType,
      date: new Date(getFormattedDate()),
      userId: ctx.state.sessionUser!.id,
    };

    let paymentMethodId = paymentMethod.id;
    if (!paymentMethod.id) {
      logger.info("Creating payment method", {
        user: ctx.state.sessionUser!.id,
        paymentMethod: paymentMethod.label,
      });
      const newPaymentMethod = await PaymentMethodService.create({
        label: paymentMethod.label,
        userId: ctx.state.sessionUser!.id,
      });
      paymentMethodId = newPaymentMethod.id;
    }

    let categoryId = paymentCategory.id;
    if (!paymentCategory.id) {
      logger.info("Creating category", {
        user: ctx.state.sessionUser!.id,
        category: paymentCategory.label,
      });
      const category = await CategoryService.create({
        label: paymentCategory.label,
        userId: ctx.state.sessionUser!.id,
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
    logger.info("Money created", { money });
    return new Response(JSON.stringify(money), { status: 201 });
  },
};
