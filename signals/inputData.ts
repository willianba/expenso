import { batch, signal } from "@preact/signals";
import { CategoryWithoutUser } from "@/db/models/category.ts";
import { PaymentMethodWithoutUser } from "@/db/models/paymentMethod.ts";

export const categories = signal<(CategoryWithoutUser | string)[]>([]);
export const paymentMethods = signal<(PaymentMethodWithoutUser | string)[]>([]);

export const updateAfterSubmit = (category: string, paymentMethod: string) => {
  const doesCategoryExist = categories.peek().some((existingCategory) => {
    if (typeof existingCategory === "string") {
      return existingCategory === category;
    }
    return existingCategory.label === category;
  });

  const doesPaymentMethodExist = paymentMethods
    .peek()
    .some((existingPaymentMethod) => {
      if (typeof existingPaymentMethod === "string") {
        return existingPaymentMethod === paymentMethod;
      }
      return existingPaymentMethod.label === paymentMethod;
    });

  const insertCategory = [...categories.peek(), category].sort();
  const insertPaymentMethod = [...paymentMethods.peek(), paymentMethod].sort();

  if (!doesPaymentMethodExist && !doesCategoryExist) {
    batch(() => {
      categories.value = insertCategory;
      paymentMethods.value = insertPaymentMethod;
    });
  } else if (!doesCategoryExist) {
    categories.value = insertCategory;
  } else if (!doesPaymentMethodExist) {
    paymentMethods.value = insertPaymentMethod;
  } else {
    return;
  }
};
