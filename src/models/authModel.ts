import mongoose, { Document, Schema } from "mongoose";

export interface IUserStep extends Document {
  identifier: string;
  otp?: string;
  otpExpiresAt?: Date | null;
  name?: string;
  dob?: string;
  gender?: string;
  role?: "user" | "author" | "writer";
  step: number;
  createdAt: Date;
  updatedAt: Date;
}

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