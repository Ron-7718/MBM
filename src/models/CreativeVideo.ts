import mongoose, { Schema, Model } from "mongoose";
import type { ICreativeVideo } from "../types";

const creativeVideoSchema = new Schema<ICreativeVideo>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    section: {
      type: String,
      enum: ["pitch_alley", "ask_universe"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    videoUrl: {
      type: String,
      required: true,
    },
    videoSize: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const CreativeVideo: Model<ICreativeVideo> = mongoose.model<ICreativeVideo>(
  "CreativeVideo",
  creativeVideoSchema,
);

export default CreativeVideo;
