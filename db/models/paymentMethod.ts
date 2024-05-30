import { User } from "@/db/models/user.ts";

export type PaymentMethod = {
  id: string; // ULID
  label: string;
  user: User;
};

export type RawPaymentMethod = Omit<PaymentMethod, "user"> & {
  userId: string;
};
