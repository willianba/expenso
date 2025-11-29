import { Context } from "fresh";
import { State } from "@/utils/state.ts";
import { env } from "@/utils/env.ts";

export async function handler(ctx: Context<State>) {
  // Check if user is signed in
  if (!ctx.state.sessionUser) {
    throw new Deno.errors.NotFound("Page not found");
  }

  // Check if user's email matches the admin email
  if (!env.ADMIN_EMAIL || ctx.state.sessionUser.email !== env.ADMIN_EMAIL) {
    throw new Deno.errors.NotFound("Page not found");
  }

  return await ctx.next();
}
