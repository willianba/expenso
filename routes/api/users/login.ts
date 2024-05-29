import { Handlers } from "$fresh/server.ts";
import { User } from "@/db/models/user.ts";
import logger from "@/utils/logger.ts";
import { z } from "zod";
import { rand as randomId } from "usid";
import { hash } from "bcrypt";
import { kv } from "@/db/kv.ts";

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const handler: Handlers<User> = {
  async POST(req, _ctx) {
    const body = Object.fromEntries(await req.formData());
    const { name, email } = CreateUserSchema.parse(body);

    const password = randomId(10);
    const encryptedPassword = await hash(password);
    await kv.set(
      ["user_login", email],
      { name, password: encryptedPassword },
      { expireIn: 10 * 1000 }, // 10 minutes
    );

    // TODO remove in the future
    logger.debug("Password generated", { password, encryptedPassword });

    // TODO actually send an email
    const url = new URL(req.url);
    url.pathname = "/password";
    url.searchParams.set("email", email);
    return Response.redirect(url);
  },
};
