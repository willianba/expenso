import Container from "@/components/Container.tsx";
import { define } from "@/utils/state.ts";
import { asset } from "fresh/runtime";

export default define.page(({ Component, state }) => {
  return (
    <html data-theme="macchiato">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Expenso</title>
        <link rel="stylesheet" href={asset("/styles.css")} />
      </head>
      <body>
        <Container sessionUser={state.sessionUser}>
          <Component />
        </Container>
      </body>
    </html>
  );
});
