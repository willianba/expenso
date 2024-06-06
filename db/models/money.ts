import { User } from "@/db/models/user.ts";
import PaymentMethodService, {
  PaymentMethod,
  RawPaymentMethod,
} from "@/db/models/paymentMethod.ts";
import CategoryService, {
  Category,
  RawCategory,
} from "@/db/models/category.ts";
import { MoneyType, PaymentType } from "@/utils/constants.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  MONEY = "money",
  MONEY_BY_USER = "money_by_user",
  MONEY_BY_PAYMENT_METHOD = "money_by_payment_method",
  MONEY_BY_CATEGORY = "money_by_category",
  MONEY_BY_DATE = "money_by_date",
}

type Payment = {
  method: PaymentMethod | RawPaymentMethod;
  category: Category | RawCategory;
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
  user: User;
};

export type MoneyWithoutUser = Omit<Money, "user">;

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

    const rawMoneyRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .check({ key: userKey, versionstamp: null })
      .set(key, moneyWithId)
      .set(userKey, moneyWithId)
      .commit();

    if (!rawMoneyRes.ok) {
      throw new Deno.errors.AlreadyExists("Money already exists");
    }

    // if no payment, means it's a non-expense money. probably an income
    if (!input.payment) {
      return moneyWithId;
    }

    const categoryKey = [
      Keys.MONEY_BY_CATEGORY,
      input.userId,
      input.payment.categoryId,
      moneyId,
    ];

    const paymentMethodKey = [
      Keys.MONEY_BY_PAYMENT_METHOD,
      input.userId,
      input.payment.methodId,
      moneyId,
    ];

    const dateKey = [
      Keys.MONEY_BY_DATE,
      input.userId,
      input.payment.date.getFullYear().toString(),
      (input.payment.date.getMonth() + 1).toString(),
      moneyId,
    ];

    const moneyWithPaymentRes = await kv
      .atomic()
      .check({ key: categoryKey, versionstamp: null })
      .check({ key: paymentMethodKey, versionstamp: null })
      .check({ key: dateKey, versionstamp: null })
      .set(categoryKey, moneyWithId)
      .set(paymentMethodKey, moneyWithId)
      .set(dateKey, moneyWithId)
      .commit();

    if (!moneyWithPaymentRes.ok) {
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

  public static async getByMonth(userId: string, year: number, month: number) {
    const entries = kv.list<RawMoney>({
      prefix: [Keys.MONEY_BY_DATE, userId, year.toString(), month.toString()],
    });

    const rawMoney: RawMoney[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return await this.populate(rawMoney, userId);
  }

  public static async getByYear(userId: string, year: number) {
    const entries = kv.list<RawMoney>({
      prefix: [Keys.MONEY_BY_DATE, userId, year.toString()],
    });

    const rawMoney: RawMoney[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return await this.populate(rawMoney, userId);
  }

  private static async populate(rawMoney: RawMoney[], userId: string) {
    const [paymentMethods, categories] = await Promise.all([
      PaymentMethodService.getAllByUserId(userId),
      CategoryService.getAllByUserId(userId),
    ]);

    const money = rawMoney.map((m) => {
      if (!m.payment) {
        return m as MoneyWithoutUser;
      }

      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === m.payment!.methodId,
      );
      const category = categories.find((c) => c.id === m.payment!.categoryId);

      const money: MoneyWithoutUser = {
        ...m,
        payment: {
          type: m.payment!.type,
          date: m.payment!.date,
          method: paymentMethod!,
          category: category!,
          ...(m.payment!.installments && {
            installments: m.payment!.installments,
          }),
        },
      };

      return money;
    });

    return money;
  }
}
