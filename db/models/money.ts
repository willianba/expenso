import { User } from "@/db/models/user.ts";
import { PaymentMethod } from "@/db/models/paymentMethod.ts";
import { Category } from "@/db/models/category.ts";

enum MoneyType {
  INCOME = "income",
  EXPENSE = "expense",
}

enum PaymentType {
  FIXED = "fixed",
  OVER_TIME = "over_time",
  CURRENT = "current",
}

export type PopulatedPayment = {
  method: PaymentMethod;
  category: Category;
  type: PaymentType;
  installments?: number;
  date: Date;
};

export type PopulatedMoney = {
  id: string;
  price: number;
  type: MoneyType;
  payment?: PopulatedPayment;
  user: User;
  report: Report;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = Omit<PopulatedPayment, "method"> & {
  methodId: string;
  categoryId: string;
};

export type Money = Omit<PopulatedMoney, "user" | "report"> & {
  userId: string;
  reportId: string;
};
