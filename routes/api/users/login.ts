import { Handlers } from "$fresh/server.ts";
import { User, UserKeys } from "@/db/models/user.ts";
import { z } from "zod";
import { rand as randomId } from "usid";
import { hashSync } from "bcrypt";
import { kv } from "@/db/kv.ts";
import mailer from "@/utils/email.ts";

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const handler: Handlers<User> = {
  async POST(req, _ctx) {
    const body = Object.fromEntries(await req.formData());
    const { name, email } = CreateUserSchema.parse(body);

    const password = randomId(10);
    const encryptedPassword = hashSync(password);
    const key = UserKeys.userLogin(email);
    await kv.set(
      key,
      { name, password: encryptedPassword },
      { expireIn: 10 * 1000 }, // 10 minutes
    );

    await mailer.send({
      from: "expenso@resend.dev",
      to: email,
      subject: "Your expenso temporary password",
      content: `Your temporary password is ${password}. Please use it in the next 10 minutes or request a new password.`,
    });

    const url = new URL(req.url);
    url.pathname = "/password";
    url.searchParams.set("email", email);
    return Response.redirect(url);
  },
};
