import { model, Schema } from "mongoose";

type Dinosaur = {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

const dinosaurSchema = new Schema<Dinosaur>(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Dinosaur name cannot be blank"],
    },
    description: {
      type: String,
      required: [true, "Dinosaur description cannot be blank"],
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

export default model("Dinosaur", dinosaurSchema);
