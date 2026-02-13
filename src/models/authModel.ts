import mongoose, { Document, Schema } from "mongoose";

export interface IUserStep extends Document {
  identifier: string; // email or phone
  otp?: string;
  name?: string;
  dob?: string;
  gender?: string;
  otpExpiresAt?: Date | null;
  step: number; // 1: registered, 2: otp verified, 3: completed
  createdAt: Date;
}

const userStepSchema = new Schema<IUserStep>(
  {
    identifier: { type: String, required: true, unique: true },
    otp: { type: String },
    name: { type: String },
    dob: { type: String },
    gender: { type: String },
    step: { type: Number, default: 1 }, // Start from Step 1
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min expiry
  },
  { timestamps: true }
);

export const UserStepModel = mongoose.model<IUserStep>(
  "UserStep",
  userStepSchema
);
