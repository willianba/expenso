import { type Cookie, getCookies } from "@std/http";

export const COOKIE_NAME = "expenso-session";

// used on UI to set default values. the actual values are replaced with the signed in user
export const BASE_COOKIE = {
  secure: true,
  path: "/",
  httpOnly: true,
  maxAge: 7776000, // 90 days
  sameSite: "Lax",
} as Required<Pick<Cookie, "path" | "httpOnly" | "maxAge" | "sameSite">>;

export function getSessionIdCookie(request: Request): string | undefined {
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

export function getCookieName(name: string, isHttps: boolean): string {
  return isHttps ? "__Host-" + name : name;
}

export function isHttps(url: string): boolean {
  return url.startsWith("https://");
}
