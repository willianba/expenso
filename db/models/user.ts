import { kv } from "@/db/kv.ts";
import { monotonicUlid } from "@std/ulid";

export type User = {
  id: string; // ULID
  name: string;
  email: string;
};

type CreateUserInput = Omit<User, "id">;

export default class UserService {
  public static async create(user: CreateUserInput) {
    const userId = monotonicUlid();
    const userWithId = { ...user, id: userId };

    const key = ["user", userId];
    const emailKey = ["user_email", user.email];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, userWithId)
      .check({ key: emailKey, versionstamp: null })
      .set(emailKey, userId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("User already exists");
    }

    return userWithId as User;
  }

  public static async getByEmail(email: string) {
    const userRes = await kv.get<User>(["user_email", email]);
    return userRes.value;
  }

  public static async getBySessionId(sessionId: string) {
    const key = ["user_session", sessionId];
    const eventualUser = await kv.get<User>(key, {
      consistency: "eventual",
    });

    if (eventualUser.value !== null) {
      return eventualUser.value;
    }

    const res = await kv.get<User>(key);
    return res.value;
  }
}
