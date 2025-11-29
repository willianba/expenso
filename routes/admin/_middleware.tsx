import { Context } from "fresh";
import { State } from "@/utils/state.ts";
import { env } from "@/utils/env.ts";

export async function handler(ctx: Context<State>) {
  // Check if user is signed in
  if (!ctx.state.sessionUser) {
    return new Response("Not Found", { status: 404 });
  }

  // Check if user's email matches the admin email
  if (!env.ADMIN_EMAIL || ctx.state.sessionUser.email !== env.ADMIN_EMAIL) {
    return new Response("Not Found", { status: 404 });
  }

  return await ctx.next();
}
