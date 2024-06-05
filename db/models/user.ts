import { kv } from "@/db/kv.ts";
import { monotonicUlid } from "@std/ulid";

export enum Keys {
  USER = "user",
  USER_BY_EMAIL = "user_by_email",
  USER_SESSION = "user_session",
  TEMPORARY_LOGIN = "user_temporary_login",
}

export type User = {
  id: string; // ULID
  email: string;
};

type CreateUserInput = Omit<User, "id">;

export default class UserService {
  public static async create(user: CreateUserInput) {
    const userId = monotonicUlid();
    const userWithId = { ...user, id: userId };

    const key = [Keys.USER, userId];
    const emailKey = [Keys.USER_BY_EMAIL, user.email];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, userWithId)
      .check({ key: emailKey, versionstamp: null })
      .set(emailKey, userWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("User already exists");
    }

    return userWithId as User;
  }

  public static async getById(userId: string) {
    const res = await kv.get<User>([Keys.USER, userId]);

    if (res.value === null) {
      throw new Deno.errors.NotFound("User not found");
    }

    return res.value;
  }

  public static async getByEmail(email: string) {
    const res = await kv.get<User>([Keys.USER_BY_EMAIL, email]);
    return res.value;
  }

  public static async getBySessionId(sessionId: string) {
    const key = [Keys.USER_SESSION, sessionId];
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
