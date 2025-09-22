import { Context } from "fresh";
import { SignedInState, State } from "@/utils/state.ts";

function assertSignedIn(ctx: {
  state: State;
}): asserts ctx is { state: SignedInState } {
  if (ctx.state.sessionUser === undefined) {
    throw new Deno.errors.PermissionDenied("User must be signed in");
  }
}

export async function handler(ctx: Context<State>) {
  if (ctx.url.pathname.startsWith("/api/auth")) {
    // Skip authentication for auth routes
    return await ctx.next();
  }

  assertSignedIn(ctx);
  return await ctx.next();
}
