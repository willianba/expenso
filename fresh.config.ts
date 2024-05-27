import { defineConfig } from "$fresh/server.ts";
import errorHandling from "@/plugins/error_handling.ts";
import session from "@/plugins/session.ts";

export default defineConfig({ plugins: [errorHandling, session] });
