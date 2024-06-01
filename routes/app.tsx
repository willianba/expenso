import { defineRoute } from "$fresh/server.ts";
import { type State } from "@/plugins/session.ts";
import Card from "@/components/Card.tsx";
import Table from "@/components/Table.tsx";

export default defineRoute<State>((_req, _ctx) => {
  return (
    <div class="grid grid-cols-5 gap-4 min-h-full">
      <div class="gap-4 col-span-2 flex flex-col">
        <Card classes="h-2/4" title="Fixed expenses">
          <div>
            Oi
          </div>
        </Card>
        <Card classes="h-2/4" title="Over time expenses">
          <div>
            Oi
          </div>
        </Card>
      </div>
      <div class="gap-4 col-span-2 flex flex-col">
        <Card classes="h-no-nav" title="Current month expenses">
          <Table />
        </Card>
      </div>
      <div class="gap-4 col-span-1 min-h-full flex flex-col">
        <Card classes="h-2/4" title="Total income">
          <div>
            Oi
          </div>
        </Card>
        <Card classes="h-2/4" title="Total expenses">
          <div>
            Oi
          </div>
        </Card>
      </div>
    </div>
  );
});
