import { User } from "@/db/models/user.ts";
import { RawPaymentMethod } from "@/db/models/paymentMethod.ts";
import { RawCategory } from "@/db/models/category.ts";

enum MoneyType {
  INCOME = "income",
  EXPENSE = "expense",
}

enum PaymentType {
  FIXED = "fixed",
  OVER_TIME = "over_time",
  CURRENT = "current",
}

export type Payment = {
  method: RawPaymentMethod;
  category: RawCategory;
  type: PaymentType;
  installments?: number;
  date: Date;
};

export type Money = {
  id: string;
  price: number;
  type: MoneyType;
  payment?: Payment;
  user: User;
  report: Report;
};

export type RawPayment = Omit<Payment, "method"> & {
  methodId: string;
  categoryId: string;
};

export type RawMoney = Omit<Money, "user" | "report"> & {
  userId: string;
  reportId: string;
};
