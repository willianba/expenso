import { model, Schema } from "mongoose";

export type User = {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

userSchema.index({ email: 1 });

export default model("User", userSchema);
