import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import errorHandling from "@/plugins/error_handling.ts";
import session from "@/plugins/session.ts";
import oauth from "@/plugins/auth.ts";

export default defineConfig({
  plugins: [oauth, session, tailwind(), errorHandling],
});
