import { User } from "@/db/models/user.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

export enum Keys {
  INCOME = "income",
  INCOME_BY_DATE = "income_by_date",
  DELETED_INCOME = "deleted_income",
}

export type Income = {
  id: string;
  source: string;
  price: number;
  date: Date;
  user: User;
};

export type RawIncome = Omit<Income, "user"> & {
  userId: string;
};

type CreateIncomeInput = Omit<RawIncome, "id">;
export type UpdateIncomeInput = Omit<RawIncome, "userId">;

export default class IncomeService {
  public static async create(input: CreateIncomeInput) {
    const incomeId = monotonicUlid();
    const incomeWithId: RawIncome = { ...input, id: incomeId };

    const key = [Keys.INCOME, input.userId, incomeId];
    const dateKey = [
      Keys.INCOME_BY_DATE,
      input.userId,
      input.date.getFullYear(),
      input.date.getMonth() + 1,
      incomeId,
    ];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .check({ key: dateKey, versionstamp: null })
      .set(key, incomeWithId)
      .set(dateKey, incomeWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Income already exists");
    }

    return incomeWithId;
  }

  public static async getByMonth(userId: string, year: number, month: number) {
    const entries = kv.list<RawIncome>({
      prefix: [Keys.INCOME_BY_DATE, userId, year, month],
    });

    const rawIncomeList: RawIncome[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return rawIncomeList;
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawIncome>({
      prefix: [Keys.INCOME_BY_DATE, userId, year],
    });

    const rawIncomeList: RawIncome[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return rawIncomeList;
  }

  public static async update(userId: string, input: UpdateIncomeInput) {
    const incomeId = input.id;
    const key = [Keys.INCOME, userId, incomeId];
    const rawIncome = await kv.get<RawIncome>(key);

    if (!rawIncome.value) {
      throw new Deno.errors.NotFound("Income not found");
    }

    const dateKey = [
      Keys.INCOME_BY_DATE,
      userId,
      rawIncome.value.date.getFullYear(),
      rawIncome.value.date.getMonth() + 1,
      incomeId,
    ];

    const updatedIncome = { ...rawIncome.value, ...input };

    const updateRes = await kv
      .atomic()
      .set(key, updatedIncome)
      .set(dateKey, updatedIncome)
      .commit();

    if (!updateRes.ok) {
      throw new Deno.errors.Interrupted("Failed to update income");
    }

    return updatedIncome;
  }

  public static async delete(userId: string, incomeId: string) {
    const key = [Keys.INCOME, userId, incomeId];
    const rawIncome = await kv.get<RawIncome>(key);

    if (!rawIncome.value) {
      throw new Deno.errors.NotFound("Income not found");
    }

    const dateKey = [
      Keys.INCOME_BY_DATE,
      userId,
      rawIncome.value.date.getFullYear(),
      rawIncome.value.date.getMonth() + 1,
      incomeId,
    ];
    const deleteKey = [Keys.DELETED_INCOME, userId, incomeId];

    const updateRes = await kv
      .atomic()
      .delete(key)
      .delete(dateKey)
      .set(deleteKey, rawIncome.value)
      .commit();

    if (!updateRes.ok) {
      throw new Deno.errors.Interrupted("Failed to delete income");
    }

    return rawIncome.value;
  }
}
