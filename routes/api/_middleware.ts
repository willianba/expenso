import { Context } from "fresh";
import { SignedInState, State } from "@/utils/state.ts";
import { env } from "@/utils/env.ts";

function assertSignedIn(ctx: {
  state: State;
}): asserts ctx is { state: SignedInState } {
  if (ctx.state.sessionUser === undefined) {
    throw new Deno.errors.PermissionDenied("User must be signed in");
  }
}

function assertAdminEmail(ctx: { state: SignedInState }): boolean {
  if (!env.ADMIN_EMAIL) {
    return false;
  }

  // Check if user's email matches the admin email
  return ctx.state.sessionUser.email === env.ADMIN_EMAIL;
}

export async function handler(ctx: Context<State>) {
  if (ctx.url.pathname.startsWith("/api/auth")) {
    // Skip authentication for auth routes
    return await ctx.next();
  }

  assertSignedIn(ctx);

  // Check admin email for /api/admin routes
  if (ctx.url.pathname.startsWith("/api/admin")) {
    if (!assertAdminEmail(ctx)) {
      // Return 404 instead of 403 for security through obscurity
      throw new Deno.errors.NotFound("Page not found");
    }
  }

  return await ctx.next();
}
