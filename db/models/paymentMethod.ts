import { User } from "@/db/models/user.ts";

export type PopulatedPaymentMethod = {
  id: string; // ULID
  label: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentMethod = Omit<PopulatedPaymentMethod, "user"> & {
  userId: string;
};
