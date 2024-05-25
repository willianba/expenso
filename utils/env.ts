import { Environment } from "@/utils/constants.ts";
import { z } from "zod";

const envSchema = z
  .object({
    MONGOOSE_USE_SSL: z.string(),
    MONGOOSE_URL: z.string(),
    MONGOOSE_DB: z.string(),
    MONGOOSE_USER: z.string(),
    MONGOOSE_PASSWORD: z.string(),
    ENVIRONMENT: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  })
  .required();

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(Deno.env.toObject());
