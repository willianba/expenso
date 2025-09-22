import { Context } from "fresh";
import { State } from "@/utils/state.ts";
import UserService from "@/db/models/user.ts";
import { getSessionIdCookie } from "@/utils/auth.ts";

export async function handler(ctx: Context<State>) {
  ctx.state.sessionUser = undefined;

  // fetch session id from cookies. try one provider at a time
  const sessionId = getSessionIdCookie(ctx.req);
  if (sessionId === undefined) {
    return await ctx.next();
  }

  const user = await UserService.getBySessionId(sessionId);
  if (user === null) {
    return await ctx.next();
  }

  ctx.state.sessionUser = user;
  return await ctx.next();
}
