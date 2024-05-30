import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, _ctx) => {
  return (
    "Congrats. You logged in!"
  );
});
