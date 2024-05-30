import { User } from "@/db/models/user.ts";

export type Category = {
  id: string; // ULID
  label: string;
  user: User;
};

export type RawCategory = Omit<Category, "user"> & {
  userId: string;
};
