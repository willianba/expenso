import { User } from "@/db/models/user.ts";

export type PopulatedCategory = {
  id: string; // ULID
  label: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = Omit<PopulatedCategory, "user"> & {
  userId: string;
};
