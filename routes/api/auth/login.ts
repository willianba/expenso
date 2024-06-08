import { Handlers } from "$fresh/server.ts";
import { User, Keys as UserKeys } from "@/db/models/user.ts";
import { z } from "zod";
import { rand as randomId } from "usid";
import { hashSync } from "bcrypt";
import { kv } from "@/db/kv.ts";
import mailer from "@/utils/email.ts";
import logger from "@/utils/logger.ts";

const CreateUserSchema = z.object({
  email: z.string().email(),
});

export const handler: Handlers<User> = {
  async POST(req, _ctx) {
    const body = Object.fromEntries(await req.formData());
    const { email } = CreateUserSchema.parse(body);

    const password = randomId(10);
    const encryptedPassword = hashSync(password);
    const key = [UserKeys.TEMPORARY_LOGIN, email];
    await kv.set(
      key,
      { password: encryptedPassword },
      { expireIn: 10 * 1000 }, // 10 minutes
    );

    try {
      await mailer.send({
        from: "Expenso <expenso@resend.dev>",
        to: email,
        subject: "Your expenso temporary password",
        html: `Your temporary password is <b>${password}</b>.
        <br />
        Please use it in the next 10 minutes or request a new password.`,
        content: `Your temporary password is ${password}. Please use it in the next 10 minutes or request a new password.`,
      });
    } catch (error) {
      logger.error(`Error sending email to ${email}`, { error });
      // TODO remove when I make the email work for everyone
      logger.debug(`Temporary password for ${email}: ${password}`);
    }

    logger.debug(`User ${email} requested a temporary password`);

    const url = new URL(req.url);
    url.pathname = "/password";
    url.searchParams.set("email", email);
    return Response.redirect(url);
  },
};
