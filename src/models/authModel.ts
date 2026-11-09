import mongoose, { Document, Schema } from "mongoose";

export interface IUserStep extends Document {
  identifier: string;
  otp?: string;
  otpExpiresAt?: Date | null;
  name?: string;
  dob?: string;
  gender?: string;
  role?: "user" | "author" | "writer";
  bio?: string;
  avatarUrl?: string;
  craft?: string;
  location?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  step: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSocialLinkSchema = new Schema(
  {
    platform: { type: String, enum: ["website", "instagram", "x", "youtube", "tiktok", "goodreads"], required: true },
    url: { type: String, trim: true, maxlength: 2048, required: true },
  },
  { _id: false },
);

const userStepSchema = new Schema<IUserStep>(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
    },

    otp: {
      type: String,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    name: {
      type: String,
    },

    dob: {
      type: String,
    },

    gender: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "author", "writer"],
    },

    bio: { type: String, trim: true, maxlength: 500, default: "" },
    avatarUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    craft: { type: String, trim: true, maxlength: 80, default: "" },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    socialLinks: { type: [userSocialLinkSchema], default: [] },

    step: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * OTP expiration only.
 *
 * This expires the OTP field's time,
 * NOT the user document.
 *
 * IMPORTANT:
 * Do NOT add a TTL index here because
 * a TTL index on otpExpiresAt would delete
 * the entire UserStep document.
 */

export const UserStepModel = mongoose.model<IUserStep>(
  "UserStep",
  userStepSchema,
);
