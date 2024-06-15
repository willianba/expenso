import { kv } from "@/db/kv.ts";
import { monotonicUlid } from "@std/ulid";
import logger from "@/utils/logger.ts";

const SESSION_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

export enum Keys {
  USERS = "users",
  USERS_BY_EMAIL = "users_by_email",
  USERS_SESSION = "users_session",
  TEMPORARY_LOGIN = "users_temporary_login",
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

    const key = [Keys.USERS, userId];
    const emailKey = [Keys.USERS_BY_EMAIL, user.email];
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
    const res = await kv.get<User>([Keys.USERS, userId]);

    if (res.value === null) {
      throw new Deno.errors.NotFound("User not found");
    }

    return res.value;
  }

  public static async getByEmail(email: string) {
    const res = await kv.get<User>([Keys.USERS_BY_EMAIL, email]);
    return res.value;
  }

  public static async getBySessionId(sessionId: string) {
    const key = [Keys.USERS_SESSION, sessionId];
    const eventualUser = await kv.get<User>(key, {
      consistency: "eventual",
    });

    if (eventualUser.value !== null) {
      return eventualUser.value;
    }

    const res = await kv.get<User>(key);
    return res.value;
  }

  public static async setSession(user: User, sessionId: string) {
    const sessionKey = [Keys.USERS_SESSION, sessionId];
    const sessionRes = await kv
      .atomic()
      .check({ key: sessionKey, versionstamp: null })
      .set(sessionKey, user, { expireIn: SESSION_TTL })
      .commit();

    if (!sessionRes.ok) {
      logger.warn("Failed to set session. User already logged in", {
        sessionId,
      });
    }
  }

  public static async deleteSession(sessionId: string) {
    await kv.delete([Keys.USERS_SESSION, sessionId]);
  }
}
