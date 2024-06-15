import type { Plugin } from "$fresh/server.ts";
import { FreshContext } from "$fresh/server.ts";
import UserService, { User } from "@/db/models/user.ts";
import { getGitHubSessionId, getGoogleSessionId } from "@/plugins/auth.ts";

export type State = {
  sessionUser?: User;
};

export type SignedInState = Required<State>;

async function setSessionState(req: Request, ctx: FreshContext<State>) {
  if (ctx.destination !== "route") {
    return await ctx.next();
  }

  // Initial state
  ctx.state.sessionUser = undefined;

  // fetch session id from cookies. try one provider at a time
  let sessionId = await getGoogleSessionId(req);
  if (sessionId === undefined) {
    sessionId = await getGitHubSessionId(req);
  }

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

async function redirectIfSignedIn(req: Request, ctx: FreshContext<State>) {
  if (ctx.state.sessionUser) {
    const url = new URL(req.url);
    url.pathname = "/app";
    return Response.redirect(url);
  }

  return await ctx.next();
}

async function redirectIfSignedOut(req: Request, ctx: FreshContext<State>) {
  if (!ctx.state.sessionUser) {
    const url = new URL(req.url);
    url.pathname = "/login";
    return Response.redirect(url);
  }

  return await ctx.next();
}

async function ensureSignedIn(_req: Request, ctx: FreshContext<State>) {
  assertSignedIn(ctx);
  return await ctx.next();
}

function assertSignedIn(ctx: {
  state: State;
}): asserts ctx is { state: SignedInState } {
  if (ctx.state.sessionUser === undefined) {
    throw new Deno.errors.PermissionDenied("User must be signed in");
  }
}

export default {
  name: "session",
  middlewares: [
    {
      path: "/",
      middleware: { handler: setSessionState },
    },
    {
      path: "/app",
      middleware: { handler: redirectIfSignedOut },
    },
    {
      path: "/login",
      middleware: { handler: redirectIfSignedIn },
    },
    {
      path: "/api/expenses/",
      middleware: { handler: ensureSignedIn },
    },
  ],
} as Plugin<State>;
