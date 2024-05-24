import { model, Schema } from "mongoose";

type Category = {
  _id: Schema.Types.ObjectId;
  label: string;
  user: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<Category>(
  {
    label: {
      type: String,
      unique: true,
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

categorySchema.index({ label: 1, user: 1 }, { unique: true });

export default model("Category", categorySchema);
