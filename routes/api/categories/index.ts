import { Handlers } from "$fresh/server.ts";
import CategoryService, { Category } from "@/db/models/category.ts";
import { SignedInState } from "@/plugins/session.ts";

export const handler: Handlers<Category, SignedInState> = {
  async GET(_req, ctx) {
    const categories = await CategoryService.getAllByUserId(
      ctx.state.sessionUser!.id,
    );

    return Response.json(categories);
  },
};
