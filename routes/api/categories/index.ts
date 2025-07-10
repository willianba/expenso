import { RouteHandler } from "fresh";
import CategoryService, { Category } from "@/db/models/category.ts";
import { SignedInState } from "@/utils/state.ts";

export const handler: RouteHandler<Category, SignedInState> = {
  async GET(ctx) {
    const categories = await CategoryService.getAllByUserId(
      ctx.state.sessionUser!.id,
    );

    return Response.json(categories);
  },
};
