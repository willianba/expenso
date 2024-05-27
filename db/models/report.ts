import { User } from "@/db/models/user.ts";

export type PopulatedReport = {
  id: string; // ULID
  month: number;
  year: number;
  user: User; // ULID
  createdAt: Date;
  updatedAt: Date;
};

export type Report = Omit<PopulatedReport, "user"> & {
  userId: string;
};
