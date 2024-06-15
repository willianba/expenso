import type { Plugin } from "$fresh/server.ts";
import {
  createGitHubOAuthConfig,
  createGoogleOAuthConfig,
  createHelpers,
} from "@deno/kv-oauth";
import { getGitHubUser } from "@/utils/auth/github.ts";
import UserService from "@/db/models/user.ts";
import logger from "@/utils/logger.ts";
import { getGoogleUser } from "@/utils/auth/google.ts";
import { env } from "@/utils/env.ts";

const githubHelpers = createHelpers(createGitHubOAuthConfig());
const {
  signIn: signInWithGithub,
  handleCallback: handleGitHubCallback,
  signOut: signOutGitHub,
} = githubHelpers;
export const { getSessionId: getGitHubSessionId } = githubHelpers;

const googleHelpers = createHelpers(
  createGoogleOAuthConfig({
    redirectUri: `${env.APP_ORIGIN}/api/auth/callback/google`,
    scope: "openid email profile",
  }),
);
const {
  signIn: signInWithGoogle,
  handleCallback: handleGoogleCallback,
  signOut: signOutGoogle,
} = googleHelpers;
export const { getSessionId: getGoogleSessionId } = googleHelpers;

export default {
  name: "oauth",
  routes: [
    {
      path: "/api/auth/login/github",
      handler: async (req) => await signInWithGithub(req),
    },
    {
      path: "/api/auth/callback/github",
      handler: async (req) => {
        const { response, tokens, sessionId } = await handleGitHubCallback(req);

        const { email } = await getGitHubUser(tokens.accessToken);
        let user = await UserService.getByEmail(email);
        if (!user) {
          logger.warn("User not found, creating it", { email });
          user = await UserService.create({ email });
        } else {
          await UserService.setSession(user, sessionId);
        }

        return response;
      },
    },
    {
      path: "/api/auth/login/google",
      handler: async (req) => await signInWithGoogle(req),
    },
    {
      path: "/api/auth/callback/google",
      handler: async (req) => {
        const { response, tokens, sessionId } = await handleGoogleCallback(req);

        const { email } = await getGoogleUser(tokens.accessToken);
        let user = await UserService.getByEmail(email);
        if (!user) {
          logger.warn("User not found, creating it", { email });
          user = await UserService.create({ email });
        } else {
          await UserService.setSession(user, sessionId);
        }

        return response;
      },
    },
    {
      path: "/api/auth/logout",
      handler: async (req) => {
        let isGitHub = false;

        let sessionId = await getGoogleSessionId(req);
        if (sessionId === undefined) {
          sessionId = await getGitHubSessionId(req);
          isGitHub = true;
        }

        if (sessionId === undefined) {
          const url = new URL(req.url);
          url.pathname = "/";
          return Response.redirect(url);
        }

        if (isGitHub) {
          const response = await signOutGitHub(req);
          await UserService.deleteSession(sessionId);
          return response;
        }

        const response = await signOutGoogle(req);
        await UserService.deleteSession(sessionId);
        return response;
      },
    },
  ],
} as Plugin;
