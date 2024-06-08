import { User } from "@/db/models/user.ts";
import { monotonicUlid } from "@std/ulid";
import { kv } from "@/db/kv.ts";

enum Keys {
  CATEGORIES = "categories",
  CATEGORIES_BY_USER = "categories_by_user",
}

export type Category = {
  id: string; // ULID
  label: string;
  user: User;
};

export type RawCategory = Omit<Category, "user"> & {
  userId: string;
};

type CreateCategoryInput = Omit<RawCategory, "id">;

export default class CategoryService {
  public static async create(input: CreateCategoryInput) {
    const categoryId = monotonicUlid();
    const categoryWithId: RawCategory = { ...input, id: categoryId };

    const key = [Keys.CATEGORIES, categoryId];
    const userKey = [Keys.CATEGORIES_BY_USER, input.userId, categoryId];
    const createRes = await kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, categoryWithId)
      .check({ key: userKey, versionstamp: null })
      .set(userKey, categoryWithId)
      .commit();

    if (!createRes.ok) {
      throw new Deno.errors.AlreadyExists("Category already exists");
    }

    return categoryWithId;
  }

  public static async getAllByUserId(userId: string) {
    const entries = kv.list<RawCategory>({
      prefix: [Keys.CATEGORIES_BY_USER, userId],
    });

    const categories: RawCategory[] = await Array.fromAsync(
      entries,
      (entry) => entry.value,
    );

    return categories;
  }
}
