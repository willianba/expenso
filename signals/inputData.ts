import { batch, signal } from "@preact/signals";

export const categories = signal<string[]>([]);
export const paymentMethods = signal<string[]>([]);

export const updateAfterSubmit = (category: string, paymentMethod: string) => {
  const doesCategoryExist = categories.peek().some((existingCategory) => {
    return existingCategory === category;
  });

  const doesPaymentMethodExist = paymentMethods
    .peek()
    .some((existingPaymentMethod) => {
      return existingPaymentMethod === paymentMethod;
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
