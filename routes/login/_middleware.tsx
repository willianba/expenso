import { Context } from "fresh";
import { State } from "@/utils/state.ts";

export async function handler(ctx: Context<State>) {
  if (ctx.state.sessionUser) {
    const url = new URL(ctx.req.url);
    url.pathname = "/app";
    return Response.redirect(url);
  }

  return await ctx.next();
}
