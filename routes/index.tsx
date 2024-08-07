import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div class="flex flex-col items-center">
      <img
        class="my-6"
        src="/logo.png"
        width="200"
        height="200"
        alt="the Fresh logo: a sliced lemon dripping with juice"
      />
      <h1 class="text-4xl font-bold">Welcome to Expenso</h1>
      <h2>Sign in on the top-right button!</h2>
    </div>
  );
});
