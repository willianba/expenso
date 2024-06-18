import { User } from "@/db/models/user.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  CATEGORIES = "categories",
}

export type Category = {
  id: string; // ULID
  label: string;
  user: User;
};

export type RawCategory = Omit<Category, "user"> & {
  userId: string;
};

export type CategoryWithoutUser = Omit<Category, "user">;

type CreateCategoryInput = Omit<RawCategory, "id">;

export default class CategoryService {
  public static async findOrCreate(input: CreateCategoryInput) {
    const existingCategories = await this.getAllByUserId(input.userId);

    const existingCategory = existingCategories.find(
      (c) => c.label === input.label,
    );

    if (existingCategory) {
      return existingCategory;
    }

    const categoryId = monotonicUlid();
    const categoryWithId: RawCategory = { ...input, id: categoryId };

    const key = [Keys.CATEGORIES, input.userId, categoryId];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, categoryWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Category already exists");
    }

    return categoryWithId;
  }

  public static async getAllByUserId(userId: string) {
    const entries = kv.list<RawCategory>({
      prefix: [Keys.CATEGORIES, userId],
    });

    const categories: RawCategory[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return categories;
  }
}
