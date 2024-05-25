import type { Plugin } from "$fresh/server.ts";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { BadRequestError, UnauthorizedError } from "@/utils/errors.ts";

export function getStatusCode(error: Error) {
  if (error instanceof Deno.errors.NotFound) {
    return STATUS_CODE.NotFound;
  }
  if (error instanceof UnauthorizedError) {
    return STATUS_CODE.Unauthorized;
  }
  if (error instanceof BadRequestError) {
    return STATUS_CODE.BadRequest;
  }
  return STATUS_CODE.InternalServerError;
}

export default {
  name: "error-handling",
  middlewares: [
    // {
    //   path: "/",
    //   middleware: {
    //     async handler(_req, ctx) {
    //       try {
    //         return await ctx.next();
    //       } catch (error) {
    //         if (error instanceof UnauthorizedError) {
    //           return redirect("/signin");
    //         }
    //         throw error;
    //       }
    //     },
    //   },
    // },
    {
      path: "/api",
      middleware: {
        async handler(_req, ctx) {
          try {
            return await ctx.next();
          } catch (error) {
            const status = getStatusCode(error);
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
