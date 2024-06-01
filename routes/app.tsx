import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div class="grid grid-cols-5 gap-4 min-h-full">
      <div class="gap-4 col-span-2 flex flex-col">
        <Card height="h-2/4" />
        <Card height="h-2/4" />
      </div>
      <div class="gap-4 col-span-2 flex flex-col">
        <Card height="h-full" />
      </div>
      <div class="gap-4 col-span-1 min-h-full flex flex-col">
        <Card height="h-2/4" />
        <Card height="h-2/4" />
      </div>
    </div>
  );
});
