import { env, envSchema } from "@/utils/env.ts";

const DENO_KV_PATH_KEY: keyof typeof envSchema.shape = "DENO_KV_PATH";

const permission = await Deno.permissions.query({
  name: "env",
  variable: DENO_KV_PATH_KEY,
});

let path: string | undefined;
if (permission.state === "granted") {
  path = env.DENO_KV_PATH;
}

export const kv = await Deno.openKv(path);
