import { Environment } from "@/utils/constants.ts";
import { z } from "zod";

export const envSchema = z.object({
  ENVIRONMENT: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  DENO_KV_PATH: z.string().optional(),
  DOMAIN: z.string(),
  RESEND_API_KEY: z.string(),
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(Deno.env.toObject());
