import { User } from "@/db/models/user.ts";
import { PaymentMethod } from "@/db/models/paymentMethod.ts";
import { Category } from "@/db/models/category.ts";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  MONEY = "money",
  MONEY_BY_USER = "money_by_user",
  MONEY_BY_PAYMENT_METHOD = "money_by_payment_method",
  MONEY_BY_CATEGORY = "money_by_category",
  MONEY_BY_MONTH = "money_by_month",
}

type Payment = {
  method: PaymentMethod;
  category: Category;
  type: PaymentType;
  date: Date;
  installments?: number;
};

export type Money = {
  id: string;
  name: string;
  price: number;
  payment?: Payment;
  type: MoneyType;
  date: Date;
  user: User;
};

export type RawPayment = Omit<Payment, "method" | "category"> & {
  methodId: string;
  categoryId: string;
};

export type RawMoney = Omit<Money, "user" | "payment"> & {
  payment?: RawPayment;
  userId: string;
};

export type CreateMoneyInput = Omit<RawMoney, "id">;

export default class MoneyService {
  public static async create(input: CreateMoneyInput) {
    const moneyId = monotonicUlid();
    const moneyWithId: RawMoney = { ...input, id: moneyId };

    const key = [Keys.MONEY, moneyId];
    const userKey = [Keys.MONEY_BY_USER, input.userId, moneyId];
    // TODO create other secondary keys for filtering later
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, moneyWithId)
      .check({ key: userKey, versionstamp: null })
      .set(userKey, moneyWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Money already exists");
    }

    return moneyWithId;
  }

  public static async getAllByUserId(userId: string) {
    const entries = kv.list<RawMoney>({
      prefix: [Keys.MONEY_BY_USER, userId],
    });

    const money: RawMoney[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );
    return money;
  }
}
