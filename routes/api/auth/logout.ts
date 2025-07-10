import { RouteHandler } from "fresh";
import { Keys as UserKeys, User } from "@/db/models/user.ts";
import { kv } from "@/db/kv.ts";
import { deleteCookie } from "@std/http";
import { State } from "@/utils/state.ts";
import {
  BASE_COOKIE,
  COOKIE_NAME,
  getCookieName,
  getSessionIdCookie,
  isHttps,
} from "@/utils/auth.ts";

export const handler: RouteHandler<User, State> = {
  async GET({ req }) {
    // TODO is this needed there is a middleware in place?
    const sessionId = getSessionIdCookie(req);
    if (sessionId === undefined) {
      const url = new URL(req.url);
      url.pathname = "/login";
      return Response.redirect(url);
    }

    await kv.delete([UserKeys.USERS_SESSION, sessionId]);

    const headers = new Headers({
      Location: "/",
    });
    const cookieName = getCookieName(COOKIE_NAME, isHttps(req.url));
    deleteCookie(headers, cookieName, {
      path: BASE_COOKIE.path,
    });
    return new Response("", { status: 302, headers });
  },
};
