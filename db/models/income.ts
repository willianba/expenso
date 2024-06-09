import { User } from "@/db/models/user.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  INCOME = "income",
  INCOME_BY_USER = "income_by_user",
  INCOME_BY_DATE = "income_by_date",
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

export default class IncomeService {
  public static async create(input: CreateIncomeInput) {
    const incomeId = monotonicUlid();
    const incomeWithId: RawIncome = { ...input, id: incomeId };

    const key = [Keys.INCOME, incomeId];
    const userKey = [Keys.INCOME_BY_USER, input.userId, incomeId];
    const dateKey = [
      Keys.INCOME_BY_DATE,
      input.userId,
      input.date.getFullYear().toString(),
      (input.date.getMonth() + 1).toString(),
      incomeId,
    ];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .check({ key: userKey, versionstamp: null })
      .check({ key: dateKey, versionstamp: null })
      .set(key, incomeWithId)
      .set(userKey, incomeWithId)
      .set(dateKey, incomeWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Income already exists");
    }

    return incomeWithId;
  }

  public static async getByMonth(userId: string, year: number, month: number) {
    const entries = kv.list<RawIncome>({
      prefix: [Keys.INCOME_BY_DATE, userId, year.toString(), month.toString()],
    });

    const rawIncomeList: RawIncome[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return rawIncomeList;
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawIncome>({
      prefix: [Keys.INCOME_BY_DATE, userId, year.toString()],
    });

    const rawIncomeList: RawIncome[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return rawIncomeList;
  }
}
