import { model, Schema } from "mongoose";

type Report = {
  _id: Schema.Types.ObjectId;
  month: number;
  year: number;
  user: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const reportSchema = new Schema<Report>(
  {
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
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

reportSchema.index({ month: 1, year: 1, user: 1 }, { unique: true });

reportSchema.virtual("money", {
  ref: "Money",
  localField: "_id",
  foreignField: "report",
  justOne: false,
});

export default model("Report", reportSchema);
