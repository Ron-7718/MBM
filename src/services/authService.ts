import { UserStepModel } from "../models/authModel";

// ✅ Step 1: Generate a random numeric OTP (default 4-digit)
export const generateOtp = (length = 4): string => {
  return Math.floor(1000 + Math.random() * 9000)
    .toString()
    .substring(0, length);
};

// ✅ Step 1: Save OTP for a given identifier (email/phone)
export const saveOtp = async (identifier: string, otp: string) => {
  // Check if the record already exists
  const existingUser = await UserStepModel.findOne({ identifier });

  if (existingUser) {
    // Update only the OTP field, don't delete user data
    existingUser.otp = otp;
    await existingUser.save();
    return existingUser;
  }

  // Create new record only if not found
  return await UserStepModel.create({
    identifier,
    otp,
    step: 1,
  });
};

// ✅ Step 2: Verify OTP validity
export const verifyOtpService = async (identifier: string, otp: string) => {
  const record = await UserStepModel.findOne({ identifier, otp });

  if (!record) return false;

  // Update to step 2 after OTP verification
  record.step = 2;
  await record.save();

  return true;
};

// ✅ Step 3: Save user details after OTP verification
export const completeProfileService = async (
  identifier: string,
  name: string,
  dob: string,
  gender: string
) => {
  // Find OTP record for this identifier (should be verified already)
  const record = await UserStepModel.findOne({ identifier });

  if (!record) {
    return {
      success: false,
      message: "No OTP session found. Please verify again.",
    };
  }

  if (record.step !== 2) {
    return { success: false, message: "OTP not verified yet." };
  }

  // Update user details
  record.name = name;
  record.dob = dob;
  record.gender = gender;
  record.step = 3;

  await record.save();

  return {
    success: true,
    message: "User details saved successfully.",
    data: record,
  };
};

// services/loginService.ts

export const loginService = async (identifier: string) => {
  // Validate identifier format
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isPhone = /^\d{10}$/.test(identifier); // adjust regex for your region

  if (!isEmail && !isPhone) {
    return {
      success: false,
      message: "Invalid email or phone number format",
    };
  }

  // Check if user exists
  let user = await UserStepModel.findOne({ identifier });
  if (!user) {
    // return error if user not found
    return {
      success: false,
      message: "User not found. Please register first.",
    };
  }

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Store OTP securely
  user.otp = otp;
  user.step = 1;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
  await user.save();

  return {
    success: true,
    message: `${otp} OTP sent successfully to your ${
      isEmail ? "email" : "phone"
    }`,
  };
};
