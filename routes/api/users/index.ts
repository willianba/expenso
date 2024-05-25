import { Handlers } from "$fresh/server.ts";
import { User } from "@/db/models/User.ts";
import logger from "@/utils/logger.ts";
import { z } from "zod";
import { rand as randomId } from "usid";

const CreateUserSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
  })
  .required();

const kv = await Deno.openKv();

export const handler: Handlers<User> = {
  async POST(req, _ctx) {
    const body = await req.json();
    const { name, email } = CreateUserSchema.parse(body);

    const password = randomId(10);
    await kv.set(
      ["user", email],
      { name, password },
      { expireIn: 10 * 1000 }, // 10 minutes
    );

    logger.debug("Password generated", { password });

    // TODO actually send an email
    return Response.json({ message: "Password sent to email" });
  },
};
