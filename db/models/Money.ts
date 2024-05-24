import { model, Schema } from "mongoose";

enum MoneyType {
  INCOME = "income",
  EXPENSE = "expense",
}

enum PaymentType {
  FIXED = "fixed",
  OVER_TIME = "over_time",
  CURRENT = "current",
}

type Payment = {
  method: Schema.Types.ObjectId;
  category: Schema.Types.ObjectId;
  type: PaymentType;
  installments?: number;
  date: Date;
};

type Money = {
  _id: Schema.Types.ObjectId;
  price: number;
  type: MoneyType;
  payment?: Payment;
  user: Schema.Types.ObjectId;
  report: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const paymentSubSchema = new Schema<Payment>(
  {
    method: {
      type: Schema.Types.Mixed,
      ref: "PaymentMethod",
      required: true,
    },
    category: {
      type: Schema.Types.Mixed,
      ref: "Category",
      required: true,
    },
    type: {
      type: String,
      enum: PaymentType,
      required: true,
    },
    installments: {
      type: Number,
      required: [
        function (this: Payment) {
          return this.type === PaymentType.OVER_TIME;
        },
        "Installments is required for payments over time.",
      ],
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const moneySchema = new Schema<Money>(
  {
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: MoneyType,
      required: true,
    },
    payment: {
      type: paymentSubSchema,
    },
    user: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
    report: {
      type: Schema.Types.Mixed,
      ref: "Report",
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model("Money", moneySchema);
