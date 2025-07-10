import { RouteHandler } from "fresh";
import { Keys as UserKeys, User } from "@/db/models/user.ts";
import { z } from "zod";
import { rand as randomId } from "usid";
import { hashSync } from "bcrypt";
import { kv } from "@/db/kv.ts";
import mailer from "@/utils/email/index.ts";
import logger from "@/utils/logger.ts";
import { State } from "@/utils/state.ts";
import { TemporaryPasswordEmail } from "@/utils/email/templates/temporary-password.tsx";
import { env } from "@/utils/env.ts";

const CreateUserSchema = z.object({
  email: z.string().email(),
});

export const handler: RouteHandler<User, State> = {
  async POST({ req }) {
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

    const { error } = await mailer.client.emails.send({
      from: "Expenso <auth@expenso.xyz>",
      to: email,
      subject: "Your expenso temporary password",
      html: TemporaryPasswordEmail(env.DOMAIN, email, password),
    });

    if (error) {
      logger.error(`Error sending email to ${email}`, { error });
      throw new Deno.errors.Http(
        `Failed to send email to ${email}: ${error.message}`,
      );
    }

    logger.debug(`User ${email} requested a temporary password`);

    const url = new URL(req.url);
    url.pathname = "/password";
    url.searchParams.set("email", email);
    return Response.redirect(url);
  },
};
