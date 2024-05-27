import { model, Schema } from "mongoose";

type PaymentMethod = {
  _id: Schema.Types.ObjectId;
  label: string;
  user: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const paymentMethodSchema = new Schema<PaymentMethod>(
  {
    label: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

paymentMethodSchema.index({ label: 1, user: 1 }, { unique: true });

export default model("PaymentMethod", paymentMethodSchema);
