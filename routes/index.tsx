import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, ctx) => {
  const isSignedIn = ctx.state.sessionUser !== undefined;

  return (
    <div class="px-4 pb-8 pt-12 mx-auto bg-base-200">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
        {!isSignedIn && (
          <a href="/login" class="btn btn-md btn-primary mt-8">Log in</a>
        )}
      </div>
    </div>
  );
});
