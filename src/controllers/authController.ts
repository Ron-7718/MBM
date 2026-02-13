import { Request, Response } from "express";
import {
  generateOtp,
  saveOtp,
  verifyOtpService,
  completeProfileService,
  loginService,
} from "../services/authService";
import jwt from "jsonwebtoken";
import { sendOtp } from "../utils/sendOtp";
import { UserStepModel } from "../models/authModel";

//
// STEP 1 — Register (Send OTP)
//
export async function register(req: Request, res: Response) {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ success: false, message: "Email or phone is required" });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[0-9]{10,15}$/.test(identifier);
    if (!isEmail && !isPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or phone format" });
    }

    const user = await UserStepModel.findOne({ identifier });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already registered. Please login.",
      });
    }

    const otp = generateOtp();
    await saveOtp(identifier, otp);

    await sendOtp(identifier, otp);

    return res.status(200).json({
      success: true,
      message: `${otp} OTP sent successfully to your ${
        isEmail ? "email" : "phone"
      }`,
      step: 1,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

//
// STEP 2 — Verify OTP
//
export async function verifyOtp(req: Request, res: Response) {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Identifier and OTP are required" });
    }

    const isValid = await verifyOtpService(identifier, otp);

    if (!isValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      step: 2,
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

//
// STEP 3 — Complete Profile
//

export async function completeProfile(req: Request, res: Response) {
  try {
    const { identifier, name, dob, gender } = req.body;

    if (!identifier || !name || !dob || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const userResult = await completeProfileService(
      identifier,
      name,
      dob,
      gender
    );

    if (!userResult?.data) {
      return res.status(400).json({
        success: false,
        message: "User data missing. Cannot generate token.",
      });
    }

    const token = jwt.sign(
      {
        id: userResult.data._id,
        identifier: userResult.data.identifier,
        name: userResult.data.name,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      data: {
        user: userResult.data,
        token, // ✅ return token to frontend
      },
      step: 3,
    });
  } catch (error: any) {
    console.error("Profile completion error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function sendLoginOtp(req: Request, res: Response) {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ success: false, message: "Email or phone is required" });
    }

    const result = await loginService(identifier);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Send login OTP error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
