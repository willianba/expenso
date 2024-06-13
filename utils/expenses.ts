import logger from "@/utils/logger.ts";
import PaymentMethodService from "@/db/models/paymentMethod.ts";
import CategoryService from "@/db/models/category.ts";
import { z } from "zod";

const EntrySchema = z.object({
  id: z.string().optional(),
  label: z.string(),
});

export const parseAndRetrievePaymentMethod = async (
  paymentMethod: string,
  userId: string,
) => {
  console.log({ paymentMethod });
  const paymentMethodData = EntrySchema.parse(JSON.parse(paymentMethod));

  let paymentMethodId = paymentMethodData.id;
  if (!paymentMethodData.id) {
    logger.info("Creating payment method", {
      user: userId,
      paymentMethod: paymentMethodData.label,
    });
    const newPaymentMethod = await PaymentMethodService.create({
      label: paymentMethodData.label.trim(),
      userId,
    });
    paymentMethodId = newPaymentMethod.id;
  }
  return paymentMethodId;
};

export const parseAndRetrieveCategory = async (
  category: string,
  userId: string,
) => {
  console.log({ category });
  const categoryData = EntrySchema.parse(JSON.parse(category));

  let categoryId = categoryData.id;
  if (!categoryData.id) {
    logger.info("Creating category", {
      user: userId,
      category: categoryData.label,
    });
    const newCategory = await CategoryService.create({
      label: categoryData.label.trim(),
      userId,
    });
    categoryId = newCategory.id;
  }
  return categoryId;
};
