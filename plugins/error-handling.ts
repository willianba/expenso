import type { Plugin } from "fresh";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { ZodError } from "zod";
import { fromError } from "zod-validation-error";

export function getStatusCode(error: Error) {
  if (error instanceof Deno.errors.NotFound) {
    return STATUS_CODE.NotFound;
  }
  if (error instanceof Deno.errors.AlreadyExists) {
    return STATUS_CODE.Conflict;
  }
  if (error instanceof Deno.errors.PermissionDenied) {
    return STATUS_CODE.Unauthorized;
  }
  if (error instanceof Deno.errors.InvalidData || error instanceof ZodError) {
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

            return new Response(error.message, {
              statusText: STATUS_TEXT[status],
              status,
            });
          }
        },
      },
    },
  ],
} as Plugin;
