import * as logger from "@std/log";

logger.setup({
  handlers: {
    default: new logger.ConsoleHandler("DEBUG", {
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

export default logger.getLogger();
