import { Handlers } from "$fresh/server.ts";
import UserModel, { User } from "@/db/models/User.ts";
import logger from "@/utils/logger.ts";
import { UnauthorizedError } from "@/utils/errors.ts";
import { z } from "@/deps.ts";

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

const kv = await Deno.openKv();

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
    const tempUser: Deno.KvEntryMaybe<TemporaryUser> = await kv.get([
      "user",
      email,
    ]);

    if (!tempUser.value) {
      logger.error("User not found in cache", { email });
      throw new UnauthorizedError("Unauthorized");
    }

    logger.debug("Comparing passwords", {
      storedPassword: tempUser.value?.password,
      password,
    });

    if (tempUser.value?.password !== password) {
      logger.error("Passwords don't match", { email });
      throw new UnauthorizedError("Unauthorized");
    }

    let user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn("User not found, creating it", { email });
      user = await UserModel.create({ name: tempUser.value?.name, email });
    }

    return Response.json({ user, message: "Succesfully logged in" });
  },
};
