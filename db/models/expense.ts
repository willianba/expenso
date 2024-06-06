import { User } from "@/db/models/user.ts";
import PaymentMethodService, {
  PaymentMethod,
  RawPaymentMethod,
} from "@/db/models/paymentMethod.ts";
import CategoryService, {
  Category,
  RawCategory,
} from "@/db/models/category.ts";
import { PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  EXPENSE = "expense",
  EXPENSE_BY_USER = "expense_by_user",
  EXPENSE_BY_PAYMENT_METHOD = "expens_by_payment_method",
  EXPENSE_BY_CATEGORY = "expense_by_category",
  EXPENSE_BY_DATE = "expense_by_date",
}

type Payment = {
  method: PaymentMethod | RawPaymentMethod;
  category: Category | RawCategory;
  type: PaymentType;
  date: Date;
  installments?: number;
};

export type Expense = {
  id: string;
  name: string;
  price: number;
  payment: Payment;
  user: User;
};

export type ExpenseWithoutUser = Omit<Expense, "user">;

type RawPayment = Omit<Payment, "method" | "category"> & {
  methodId: string;
  categoryId: string;
};

export type RawExpense = Omit<Expense, "user" | "payment"> & {
  payment: RawPayment;
  userId: string;
};

export type CreateExpenseInput = Omit<RawExpense, "id">;

export default class ExpenseService {
  public static async create(input: CreateExpenseInput) {
    const expenseId = monotonicUlid();
    const expenseWithId: RawExpense = { ...input, id: expenseId };

    const key = [Keys.EXPENSE, expenseId];
    const userKey = [Keys.EXPENSE_BY_USER, input.userId, expenseId];
    const categoryKey = [
      Keys.EXPENSE_BY_CATEGORY,
      input.userId,
      input.payment.categoryId,
      expenseId,
    ];

    const paymentMethodKey = [
      Keys.EXPENSE_BY_PAYMENT_METHOD,
      input.userId,
      input.payment.methodId,
      expenseId,
    ];

    const dateKey = [
      Keys.EXPENSE_BY_DATE,
      input.userId,
      input.payment.date.getFullYear().toString(),
      (input.payment.date.getMonth() + 1).toString(),
      expenseId,
    ];

    const rawExpenseRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .check({ key: userKey, versionstamp: null })
      .check({ key: categoryKey, versionstamp: null })
      .check({ key: paymentMethodKey, versionstamp: null })
      .check({ key: dateKey, versionstamp: null })
      .set(key, expenseWithId)
      .set(userKey, expenseWithId)
      .set(categoryKey, expenseWithId)
      .set(paymentMethodKey, expenseWithId)
      .set(dateKey, expenseWithId)
      .commit();

    if (!rawExpenseRes.ok) {
      throw new Deno.errors.AlreadyExists("Expense already exists");
    }

    const [populatedExpense] = await ExpenseService.populate(
      [expenseWithId],
      input.userId,
    );

    return populatedExpense;
  }

  public static async getByMonth(userId: string, year: number, month: number) {
    const entries = kv.list<RawExpense>({
      prefix: [Keys.EXPENSE_BY_DATE, userId, year.toString(), month.toString()],
    });

    const rawExpenses: RawExpense[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return await this.populate(rawExpenses, userId);
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawExpense>({
      prefix: [Keys.EXPENSE_BY_DATE, userId, year.toString()],
    });

    const rawExpenses: RawExpense[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return await this.populate(rawExpenses, userId);
  }

  private static async populate(rawExpenses: RawExpense[], userId: string) {
    const [paymentMethods, categories] = await Promise.all([
      PaymentMethodService.getAllByUserId(userId),
      CategoryService.getAllByUserId(userId),
    ]);

    const expenses = rawExpenses.map((re) => {
      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === re.payment.methodId,
      )!;
      const category = categories.find((c) => c.id === re.payment.categoryId)!;

      const expense: ExpenseWithoutUser = {
        ...re,
        payment: {
          type: re.payment.type,
          date: re.payment.date,
          method: paymentMethod,
          category: category,
          ...(re.payment.installments && {
            installments: re.payment.installments,
          }),
        },
      };

      return expense;
    });

    return expenses;
  }
}
