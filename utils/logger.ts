import * as logger from "@std/log";

logger.setup({
  handlers: {
    default: new logger.ConsoleHandler("DEBUG", {
      formatter: (record) =>
        JSON.stringify({
          message: record.msg,
          time: record.datetime.toISOString(),
          ...(record.args[0] as Record<string, unknown>),
        }),
      useColors: false,
    }),
  },
});

export default logger;
