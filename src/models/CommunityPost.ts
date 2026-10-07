import mongoose, { Schema, type Model } from "mongoose";
import type { ICommunityPost } from "../types";

const communityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String, required: true },
    likedBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

communityPostSchema.index({ createdAt: -1 });

const CommunityPost: Model<ICommunityPost> = mongoose.model<ICommunityPost>(
  "CommunityPost",
  communityPostSchema,
);

export default CommunityPost;
