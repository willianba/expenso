import { Handlers } from "$fresh/server.ts";
import { User, UserKeys } from "@/db/models/user.ts";
import { kv } from "@/db/kv.ts";
import {
  BASE_COOKIE,
  COOKIE_NAME,
  getCookieName,
  getSessionIdCookie,
  isHttps,
} from "@/plugins/session.ts";
import { deleteCookie } from "@std/http";

export const handler: Handlers<User> = {
  async GET(req, _ctx) {
    const sessionId = getSessionIdCookie(req);
    if (sessionId === undefined) {
      const url = new URL(req.url);
      url.pathname = "/login";
      return Response.redirect(url);
    }

    await kv.delete(UserKeys.userSession(sessionId));

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
