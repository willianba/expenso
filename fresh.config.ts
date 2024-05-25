import { defineConfig } from "$fresh/server.ts";
import errorHandling from "./plugins/error_handling.ts";

export default defineConfig({ plugins: [errorHandling] });
