import { CreateExpenseData } from "@/routes/api/expenses/index.ts";
import {
  parseAndRetrieveCategory,
  parseAndRetrievePaymentMethod,
} from "@/utils/expenses/paymentMetadata.ts";
import { CreateExpenseInput } from "@/db/models/expense.ts";
import { PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";

export default class ExpenseInputFactory {
  private readonly data: CreateExpenseData;
  private readonly userId: string;

  constructor(data: CreateExpenseData, userId: string) {
    this.data = data;
    this.userId = userId;
  }

  public async build(): Promise<CreateExpenseInput[]> {
    const correlationId = monotonicUlid();
    const [paymentMethodId, categoryId] = await Promise.all([
      parseAndRetrievePaymentMethod(this.data.paymentMethod, this.userId),
      parseAndRetrieveCategory(this.data.paymentCategory, this.userId),
    ]);

    switch (this.data.paymentType) {
      case PaymentType.CURRENT: {
        const createExpenseInput: CreateExpenseInput = {
          name: this.data.name,
          price: Number(this.data.price),
          userId: this.userId,
          correlationId,
          payment: {
            methodId: paymentMethodId,
            categoryId: categoryId,
            type: this.data.paymentType,
            date: new Date(this.data.paymentDate),
          },
        };

        return [createExpenseInput];
      }
      case PaymentType.FIXED: {
        const month = new Date(this.data.paymentDate).getMonth();
        const missingMonths = 12 - month;

        const inputs: CreateExpenseInput[] = [];
        for (let i = 1; i <= missingMonths; i++) {
          const date = this.getInstallmentDate(i);
          inputs.push({
            name: this.data.name,
            price: Number(this.data.price),
            userId: this.userId,
            correlationId,
            payment: {
              methodId: paymentMethodId,
              categoryId: categoryId,
              type: this.data.paymentType,
              date,
            },
          });
        }

        return inputs;
      }
      case PaymentType.OVER_TIME: {
        const installments = Number(this.data.installments);
        const installmentPrice = Number(this.data.price) / installments;
        const correlationId = monotonicUlid();

        const inputs: CreateExpenseInput[] = [];
        for (let i = 1; i <= installments; i++) {
          const date = this.getInstallmentDate(i);
          inputs.push({
            name: this.data.name,
            price: installmentPrice,
            userId: this.userId,
            correlationId,
            payment: {
              methodId: paymentMethodId,
              categoryId: categoryId,
              type: this.data.paymentType,
              date,
              installment: i,
              installments,
            },
          });
        }

        return inputs;
      }
      default:
        throw new Deno.errors.InvalidData("Invalid payment type");
    }
  }

  private getInstallmentDate(installment: number) {
    return installment === 1
      ? new Date(this.data.paymentDate)
      : new Date(
          new Date(this.data.paymentDate).setMonth(
            new Date(this.data.paymentDate).getMonth() + installment - 1,
          ),
        );
  }
}
