import mongoose, { Schema, Model, Document, Types } from "mongoose";
import slugify from "slugify";

export interface ISubcategory extends Document {
  name: string;
  slug: string;
  category: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
      maxlength: [100, "Subcategory name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
  },
  { timestamps: true },
);

subcategorySchema.pre("validate", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// A subcategory name must be unique within its parent category
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

const Subcategory: Model<ISubcategory> = mongoose.model<ISubcategory>(
  "Subcategory",
  subcategorySchema,
);

export default Subcategory;
