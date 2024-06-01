import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Centered from "@/components/layout/Centered.tsx";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <Centered>
      <div class="flex flex-col items-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
      </div>
    </Centered>
  );
});
