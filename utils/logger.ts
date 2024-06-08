import * as log from "@std/log";
import { env } from "@/utils/env.ts";

log.setup({
  handlers: {
    friendlyJson: new log.ConsoleHandler("DEBUG", {
      formatter: (record) =>
        JSON.stringify({
          message: record.msg,
          ...(record.args[0] as Record<string, unknown>),
          time: record.datetime.toISOString(),
        }),
      useColors: false,
    }),
  },
  loggers: {
    dev: {
      level: "DEBUG",
      handlers: ["friendlyJson"],
    },
    prod: {
      level: "INFO",
      handlers: ["friendlyJson"],
    },
  },
});

export default log.getLogger(env.ENVIRONMENT);
