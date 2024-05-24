import { Handlers } from "$fresh/server.ts";
import UserModel, { User } from "../../../db/models/User.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import logger from "../../../utils/logger.ts";

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
      return new Response(JSON.stringify(validation.error.issues), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const { email, password } = validation.data;

    try {
      logger.info("Finding user in cache by email", { email });
      const tempUser: Deno.KvEntryMaybe<TemporaryUser> = await kv.get([
        "user",
        email,
      ]);

      if (!tempUser.value) {
        logger.error("User not found in cache", { email });
        return new Response(JSON.stringify({ message: "User not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }

      logger.debug("Comparing passwords", {
        storedPassword: tempUser.value?.password,
        password,
      });

      if (tempUser.value?.password !== password) {
        logger.error("Passwords don't match", { email });
        return new Response(
          JSON.stringify({ message: "Passwords don't match" }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        );
      }

      let user = await UserModel.findOne({ email });
      if (!user) {
        logger.warn("User not found, creating it", { email });
        user = await UserModel.create({ name: tempUser.value?.name, email });
      }

      return new Response(
        JSON.stringify({ user, message: "Succesfully logged in" }),
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
