import type { Plugin } from "$fresh/server.ts";
import { FreshContext } from "$fresh/server.ts";
import { type Cookie, getCookies } from "@std/http";
import UserService, { User } from "@/db/models/user.ts";

export type State = {
  sessionUser?: User;
};

type SignedInState = Required<State>;

const COOKIE_NAME = "expenso-session";

// used on UI to set default values. the actual values are replaces with the signed in user
const BASE_COOKIE = {
  secure: true,
  path: "/",
  httpOnly: true,
  maxAge: 7776000, // 90 days
  sameSite: "Lax",
} as Required<Pick<Cookie, "path" | "httpOnly" | "maxAge" | "sameSite">>;

async function setSessionState(req: Request, ctx: FreshContext<State>) {
  if (ctx.destination !== "route") {
    return await ctx.next();
  }

  // Initial state
  ctx.state.sessionUser = undefined;

  const sessionId = getSessionIdCookie(req);
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

function getSessionIdCookie(request: Request): string | undefined {
  const cookieName = getCookieName(COOKIE_NAME, isHttps(request.url));
  return getCookies(request.headers)[cookieName];
}

export function generateSessionIdCookie(request: Request, sessionId: string) {
  const https = isHttps(request.url);
  const cookieName = getCookieName(COOKIE_NAME, https);
  const cookie: Cookie = {
    ...BASE_COOKIE,
    name: cookieName,
    value: sessionId,
    secure: https,
  };
  return cookie;
}

function getCookieName(name: string, isHttps: boolean): string {
  return isHttps ? "__Host-" + name : name;
}

function isHttps(url: string): boolean {
  return url.startsWith("https://");
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
      // TODO remove. kept as example for now
      path: "/test",
      middleware: { handler: ensureSignedIn },
    },
  ],
} as Plugin<State>;
