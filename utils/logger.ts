import { log } from "@/deps.ts";

log.setup({
  handlers: {
    default: new log.ConsoleHandler("DEBUG", {
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
    default: {
      level: "DEBUG",
      handlers: ["default"],
    },
  },
});

export default log.getLogger();
