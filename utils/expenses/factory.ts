import { CreateExpenseData } from "@/routes/api/expenses/index.ts";
import { CreateExpenseInput } from "@/db/models/expense.ts";
import { PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";
import PaymentMethodService from "@/db/models/payment-method.ts";
import CategoryService from "@/db/models/category.ts";
import { parseUserTimezoneAsUTC } from "@/utils/date.ts";

export default class ExpenseInputFactory {
  private readonly data: CreateExpenseData;
  private readonly userId: string;

  constructor(data: CreateExpenseData, userId: string) {
    this.data = data;
    this.userId = userId;
  }

  public async build(): Promise<CreateExpenseInput[]> {
    const correlationId = monotonicUlid();
    const [paymentMethod, category] = await Promise.all([
      PaymentMethodService.findOrCreate({
        label: this.data.paymentMethod.trim(),
        userId: this.userId,
      }),
      CategoryService.findOrCreate({
        label: this.data.paymentCategory.trim(),
        userId: this.userId,
      }),
    ]);

    switch (this.data.paymentType) {
      case PaymentType.CURRENT: {
        const createExpenseInput: CreateExpenseInput = {
          name: this.data.name,
          price: Number(this.data.price),
          userId: this.userId,
          correlationId,
          payment: {
            method: paymentMethod.label,
            category: category.label,
            type: this.data.paymentType,
            date: parseUserTimezoneAsUTC(this.data.paymentDate),
          },
        };

        return [createExpenseInput];
      }
      case PaymentType.FIXED: {
        const baseDate = parseUserTimezoneAsUTC(this.data.paymentDate);
        const month = baseDate.getMonth();
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
              method: paymentMethod.label,
              category: category.label,
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
              method: paymentMethod.label,
              category: category.label,
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
    const baseDate = parseUserTimezoneAsUTC(this.data.paymentDate);
    if (installment === 1) {
      return baseDate;
    }
    
    // For subsequent installments, add months while preserving the timezone handling
    const nextMonthDate = new Date(baseDate);
    nextMonthDate.setMonth(baseDate.getMonth() + installment - 1);
    return nextMonthDate;
  }
}
