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
  EXPENSES = "expenses",
  EXPENSES_BY_USER = "expenses_by_user",
  EXPENSES_BY_DATE = "expenses_by_date",
  DELETED_EXPENSES = "deleted_expenses",
}

type Payment = {
  method: PaymentMethod | RawPaymentMethod;
  category: Category | RawCategory;
  type: PaymentType;
  date: Date;
  installment?: number;
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
export type UpdateExpenseInput = Omit<
  RawExpense,
  "payment" | "userId" | "price"
> & {
  payment: Partial<RawPayment>;
  price?: number;
};

export default class ExpenseService {
  public static async create(input: CreateExpenseInput) {
    const expenseId = monotonicUlid();
    const expenseWithId: RawExpense = { ...input, id: expenseId };

    const key = [Keys.EXPENSES, expenseId];
    const userKey = [Keys.EXPENSES_BY_USER, input.userId, expenseId];
    const dateKey = [
      Keys.EXPENSES_BY_DATE,
      input.userId,
      input.payment.date.getFullYear().toString(),
      (input.payment.date.getMonth() + 1).toString(),
      expenseId,
    ];

    const rawExpenseRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .check({ key: userKey, versionstamp: null })
      .check({ key: dateKey, versionstamp: null })
      .set(key, expenseWithId)
      .set(userKey, expenseWithId)
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
      prefix: [
        Keys.EXPENSES_BY_DATE,
        userId,
        year.toString(),
        month.toString(),
      ],
    });

    const rawExpenses: RawExpense[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return await this.populate(rawExpenses, userId);
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawExpense>({
      prefix: [Keys.EXPENSES_BY_DATE, userId, year.toString()],
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

      const { categoryId: _, methodId: __, ...payment } = re.payment;

      const expense: ExpenseWithoutUser = {
        ...re,
        payment: {
          ...payment,
          method: paymentMethod,
          category: category,
        },
      };

      return expense;
    });

    return expenses;
  }

  public static async update(userId: string, input: UpdateExpenseInput) {
    const expenseId = input.id;

    const key = [Keys.EXPENSES, expenseId];
    const rawExpense = await kv.get<RawExpense>(key);

    if (!rawExpense.value) {
      throw new Deno.errors.NotFound("Expense not found");
    }

    const [populatedExpense] = await this.populate([rawExpense.value], userId);

    const userKey = [Keys.EXPENSES_BY_USER, userId, expenseId];
    const dateKey = [
      Keys.EXPENSES_BY_DATE,
      userId,
      populatedExpense.payment.date.getFullYear().toString(),
      (populatedExpense.payment.date.getMonth() + 1).toString(),
      expenseId,
    ];

    // TODO if expense fixed, also update all the next ones
    // same for over time expenses
    const updatedExpense: RawExpense = {
      ...rawExpense.value,
      ...input,
      payment: {
        ...rawExpense.value.payment,
        ...input.payment,
      },
    };

    const res = await kv
      .atomic()
      .set(key, updatedExpense)
      .set(userKey, updatedExpense)
      .set(dateKey, updatedExpense)
      .commit();

    if (!res.ok) {
      throw new Deno.errors.Interrupted("Failed to update expense");
    }

    const [newPopulatedExpense] = await this.populate([updatedExpense], userId);
    return newPopulatedExpense;
  }

  public static async delete(userId: string, expenseId: string) {
    const key = [Keys.EXPENSES, expenseId];
    const rawExpense = await kv.get<RawExpense>(key);

    if (!rawExpense.value) {
      throw new Deno.errors.NotFound("Expense not found");
    }

    const [populatedExpense] = await this.populate([rawExpense.value], userId);

    const userKey = [Keys.EXPENSES_BY_USER, userId, expenseId];
    const dateKey = [
      Keys.EXPENSES_BY_DATE,
      userId,
      populatedExpense.payment.date.getFullYear().toString(),
      (populatedExpense.payment.date.getMonth() + 1).toString(),
      expenseId,
    ];
    const deletedKey = [Keys.DELETED_EXPENSES, userId, expenseId];

    const res = await kv
      .atomic()
      .check({ key: deletedKey, versionstamp: null })
      .delete(key)
      .delete(userKey)
      .delete(dateKey)
      .set(deletedKey, rawExpense.value)
      .commit();

    if (!res.ok) {
      throw new Deno.errors.Interrupted("Failed to delete expense");
    }

    return rawExpense.value;
  }
}
