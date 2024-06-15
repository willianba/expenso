import { Environment } from "@/utils/constants.ts";
import { z } from "zod";

export const envSchema = z.object({
  ENVIRONMENT: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  DENO_KV_PATH: z.string().optional(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_APP_ORIGIN: z.string(),
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(Deno.env.toObject());
