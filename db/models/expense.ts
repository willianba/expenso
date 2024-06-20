import { User } from "@/db/models/user.ts";
import { PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";
import { stripDate } from "@/utils/date.ts";

enum Keys {
  EXPENSES = "expenses",
  EXPENSES_BY_DATE = "expenses_by_date",
  EXPENSES_BY_CORRELATION = "expenses_by_correlation",
  DELETED_EXPENSES = "deleted_expenses",
}

type Payment = {
  method: string;
  category: string;
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
  correlationId: string;
};

export type ExpenseWithoutUser = Omit<Expense, "user">;

export type RawExpense = Omit<Expense, "user"> & {
  userId: string;
};

export type CreateExpenseInput = Omit<RawExpense, "id">;
export type UpdateExpenseInput = Omit<
  RawExpense,
  "payment" | "userId" | "price" | "correlationId"
> & {
  payment: Pick<Payment, "method" | "category" | "date">;
  price?: number;
};

export default class ExpenseService {
  public static async create(input: CreateExpenseInput) {
    const expenseId = monotonicUlid();
    const expenseWithId: RawExpense = { ...input, id: expenseId };

    const key = [Keys.EXPENSES, input.userId, expenseId];
    const correlationKey = [
      Keys.EXPENSES_BY_CORRELATION,
      input.userId,
      input.correlationId,
      expenseId,
    ];
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
      .check({ key: dateKey, versionstamp: null })
      .check({ key: correlationKey, versionstamp: null })
      .set(key, expenseWithId)
      .set(dateKey, expenseWithId)
      .set(correlationKey, expenseWithId)
      .commit();

    if (!rawExpenseRes.ok) {
      throw new Deno.errors.AlreadyExists("Expense already exists");
    }

    return expenseWithId;
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

    return rawExpenses;
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawExpense>({
      prefix: [Keys.EXPENSES_BY_DATE, userId, year.toString()],
    });

    const rawExpenses: RawExpense[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return rawExpenses;
  }

  public static async update(userId: string, input: UpdateExpenseInput) {
    const { id: expenseId, ...payload } = input;
    const key = [Keys.EXPENSES, userId, expenseId];
    const rawExpense = await kv.get<RawExpense>(key);

    if (!rawExpense.value) {
      throw new Deno.errors.NotFound("Expense not found");
    }

    const correlatedExpensesIterator = kv.list<RawExpense>({
      prefix: [
        Keys.EXPENSES_BY_CORRELATION,
        userId,
        rawExpense.value.correlationId,
      ],
    });
    const correlatedExpenses = await Array.fromAsync(
      correlatedExpensesIterator,
      (entry) => entry.value,
    );

    let expensesToUpdate: RawExpense[] = correlatedExpenses;
    if (rawExpense.value.payment.type === PaymentType.FIXED) {
      const { month: initialMonth } = stripDate(
        new Date(rawExpense.value.payment.date),
      );
      expensesToUpdate = correlatedExpenses.filter((e) => {
        return stripDate(e.payment.date).month >= initialMonth;
      });
    }

    // TODO make this more atomic. if one fails, all should fail
    expensesToUpdate.forEach(async (expense) => {
      const expenseKey = [Keys.EXPENSES, userId, expense.id];
      const correlationKey = [
        Keys.EXPENSES_BY_CORRELATION,
        userId,
        expense.correlationId,
        expense.id,
      ];
      const dateKey = [
        Keys.EXPENSES_BY_DATE,
        userId,
        expense.payment.date.getFullYear().toString(),
        (expense.payment.date.getMonth() + 1).toString(),
        expense.id,
      ];

      // keep the original date, only update the day
      expense.payment.date.setDate(input.payment.date.getDate());
      const updatedExpense = {
        ...expense,
        ...payload,
        payment: {
          ...expense.payment,
          ...payload.payment,
          date: expense.payment.date,
        },
      };

      const res = await kv
        .atomic()
        .set(expenseKey, updatedExpense)
        .set(dateKey, updatedExpense)
        .set(correlationKey, updatedExpense)
        .commit();

      if (!res.ok) {
        throw new Deno.errors.Interrupted("Failed to update expense");
      }
    });

    const updatedExpense = {
      ...rawExpense.value,
      ...input,
      payment: {
        ...rawExpense.value.payment,
        ...input.payment,
      },
    };

    return updatedExpense;
  }

  public static async delete(userId: string, expenseId: string) {
    const key = [Keys.EXPENSES, userId, expenseId];
    const rawExpense = await kv.get<RawExpense>(key);

    if (!rawExpense.value) {
      throw new Deno.errors.NotFound("Expense not found");
    }

    const correlatedExpensesIterator = kv.list<RawExpense>({
      prefix: [
        Keys.EXPENSES_BY_CORRELATION,
        userId,
        rawExpense.value.correlationId,
      ],
    });
    const correlatedExpenses = await Array.fromAsync(
      correlatedExpensesIterator,
      (entry) => entry.value,
    );

    let expensesToDelete: RawExpense[] = correlatedExpenses;

    // fixed expenses should be deleted from the selected month onwards
    // over time expenses should delete all correlated expenses too
    // ^ same for fixed. but fixed is always one expense, so it's easier
    if (rawExpense.value.payment.type === PaymentType.FIXED) {
      const initialMonth = rawExpense.value.payment.date.getMonth() + 1;
      expensesToDelete = correlatedExpenses.filter(
        (e) => e.payment.date.getMonth() + 1 >= initialMonth,
      );
    }
    // TODO make this more atomic. if one fails, all should fail
    expensesToDelete.forEach(async (expense) => {
      const expenseKey = [Keys.EXPENSES, userId, expense.id];
      const correlationKey = [
        Keys.EXPENSES_BY_CORRELATION,
        userId,
        expense.correlationId,
        expense.id,
      ];
      const dateKey = [
        Keys.EXPENSES_BY_DATE,
        userId,
        expense.payment.date.getFullYear().toString(),
        (expense.payment.date.getMonth() + 1).toString(),
        expense.id,
      ];
      const deletedKey = [Keys.DELETED_EXPENSES, userId, expense.id];

      const res = await kv
        .atomic()
        .delete(expenseKey)
        .delete(dateKey)
        .delete(correlationKey)
        .set(deletedKey, expense)
        .commit();

      if (!res.ok) {
        throw new Deno.errors.Interrupted(
          `Failed to delete expense. Expense ID: ${expense.id}`,
        );
      }
    });

    return rawExpense.value;
  }
}
