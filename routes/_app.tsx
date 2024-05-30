import { defineRoute } from "$fresh/server.ts";
import Container from "@/components/Container.tsx";
import { State } from "@/plugins/session.ts";

export default defineRoute<State>((_req, ctx) => {
  return (
    <html data-theme="macchiato">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Expenso</title>
        <link rel="stylesheet" href="/normalize.css" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div>
          <Container sessionUser={ctx.state.sessionUser}>
            <ctx.Component />
          </Container>
        </div>
      </body>
    </html>
  );
});
