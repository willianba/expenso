import { User } from "@/db/models/user.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  PAYMENT_METHODS = "payment_methods",
  PAYMENT_METHODS_BY_USER = "payment_methods_by_user",
}

export type PaymentMethod = {
  id: string; // ULID
  label: string;
  user: User;
};

export type RawPaymentMethod = Omit<PaymentMethod, "user"> & {
  userId: string;
};

export type PaymentMethodWithoutUser = Omit<PaymentMethod, "user">;

type CreatePaymentMethodInput = Omit<RawPaymentMethod, "id">;

export default class PaymentMethodService {
  public static async create(input: CreatePaymentMethodInput) {
    const paymentMethodId = monotonicUlid();
    const paymentMethodWithId: RawPaymentMethod = {
      ...input,
      id: paymentMethodId,
    };

    const key = [Keys.PAYMENT_METHODS, paymentMethodId];
    const userKey = [
      Keys.PAYMENT_METHODS_BY_USER,
      input.userId,
      paymentMethodId,
    ];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, paymentMethodWithId)
      .check({ key: userKey, versionstamp: null })
      .set(userKey, paymentMethodWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Payment method already exists");
    }

    return paymentMethodWithId;
  }

  public static async getAllByUserId(userId: string) {
    const entries = kv.list<RawPaymentMethod>({
      prefix: [Keys.PAYMENT_METHODS_BY_USER, userId],
    });

    const paymentMethods: RawPaymentMethod[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return paymentMethods;
  }
}
