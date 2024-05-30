import { kv } from "@/db/kv.ts";
import { monotonicUlid } from "@std/ulid";

export const UserKeys = {
  user: (userId: string) => ["user", userId] as const,
  userEmail: (email: string) => ["user_email", email] as const,
  userSession: (sessionId: string) => ["user_session", sessionId] as const,
  userLogin: (email: string) => ["user_login", email] as const,
};

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

    const key = UserKeys.user(userId);
    const emailKey = UserKeys.userEmail(user.email);
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

  public static async getById(userId: string) {
    const res = await kv.get<User>(UserKeys.user(userId));

    if (res.value === null) {
      throw new Deno.errors.NotFound("User not found");
    }

    return res.value;
  }

  public static async getByEmail(email: string) {
    const res = await kv.get<User>(UserKeys.userEmail(email));
    return res.value;
  }

  public static async getBySessionId(sessionId: string) {
    const key = UserKeys.userSession(sessionId);
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
