import { Handlers } from "$fresh/server.ts";
import logger from "@/utils/logger.ts";
import { z } from "zod";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/src/main.ts";
import { kv } from "@/db/kv.ts";
import UserService, { User } from "@/db/models/user.ts";

const LoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().length(10),
  })
  .required();

type TemporaryUser = {
  name: string;
  password: string;
};

const SESSION_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

export const handler: Handlers<User> = {
  async POST(req, _ctx) {
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(validation.error.issues, {
        status: 400,
      });
    }

    const { email, password } = validation.data;

    logger.info("Finding user in cache by email", { email });
    const tempUser = await kv.get<TemporaryUser>(["user_login", email]);

    if (!tempUser.value) {
      logger.error("User not found in cache", { email });
      throw new Deno.errors.PermissionDenied("Unauthorized");
    }

    const doesPasswordMatch = await compare(password, tempUser.value?.password);

    if (!doesPasswordMatch) {
      logger.error("Passwords don't match", { email });
      throw new Deno.errors.PermissionDenied("Unauthorized");
    }

    let user = await UserService.getByEmail(email);
    if (!user) {
      logger.warn("User not found, creating it", { email });
      user = await UserService.create({ email, name: tempUser.value.name });
    }

    const sessionId = crypto.randomUUID();
    const sessionKey = ["user_session", sessionId];
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

    return Response.json({ user, message: "Succesfully logged in" });
  },
};
