import { Handlers } from "$fresh/server.ts";
import UserModel, { User } from "../../../db/models/User.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import * as usid from "https://deno.land/x/usid@2.0.0/mod.ts";
import logger from "../../../utils/logger.ts";

const CreateUserSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
  })
  .required();

const kv = await Deno.openKv();

export const handler: Handlers<User> = {
  async GET(_req, _ctx) {
    const users = await UserModel.find();
    return new Response(JSON.stringify(users), {
      headers: {
        "content-type": "application/json",
      },
    });
  },
  async POST(req, _ctx) {
    const body = await req.json();
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.issues), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { name, email } = validation.data;

    try {
      const password = usid.rand(10);
      await kv.set(
        ["user", email],
        { name, password },
        { expireIn: 10 * 1000 }, // 10 minutes
      );

      logger.debug("Password generated", { password });

      return new Response(
        JSON.stringify({ message: "Password sent to email" }),
        {
          headers: { "content-type": "application/json" },
        },
      );
    } catch (error) {
      return new Response(error.message, {
        status: 400,
        headers: { "content-type": "text/plain" },
      });
    }
  },
};
