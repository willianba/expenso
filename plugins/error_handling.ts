import type { Plugin } from "$fresh/server.ts";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { BadRequestError, UnauthorizedError } from "@/utils/errors.ts";
import { ZodError } from "@/deps.ts";
import { fromError } from "zod-validation-error";

export function getStatusCode(error: Error) {
  if (error instanceof Deno.errors.NotFound) {
    return STATUS_CODE.NotFound;
  }
  if (error instanceof UnauthorizedError) {
    return STATUS_CODE.Unauthorized;
  }
  if (error instanceof BadRequestError || error instanceof ZodError) {
    return STATUS_CODE.BadRequest;
  }
  return STATUS_CODE.InternalServerError;
}

export default {
  name: "error-handling",
  middlewares: [
    {
      path: "/api",
      middleware: {
        async handler(_req, ctx) {
          try {
            return await ctx.next();
          } catch (error) {
            const status = getStatusCode(error);

            if (error instanceof ZodError) {
              const validationError = fromError(error);
              return new Response(validationError.message, { status });
            }

            return Response.json(
              { message: error.message },
              {
                statusText: STATUS_TEXT[status],
                status,
              },
            );
          }
        },
      },
    },
  ],
} as Plugin;
