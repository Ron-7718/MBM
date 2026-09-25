import mongoose, { Schema, Model } from "mongoose";
import type { IComment } from "../types";

const commentSchema = new Schema<IComment>(
  {
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      default: "Anonymous",
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema,
);

export default Comment;
