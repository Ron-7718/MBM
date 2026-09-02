import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Constant-time string comparison to avoid timing attacks on credential checks.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/admin/auth/login — env-credential admin login, independent of the
 * OTP-based user auth flow. Issues a short-lived JWT with role: "admin".
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "";
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      return res
        .status(500)
        .json({ success: false, message: "Admin login is not configured" });
    }

    const emailMatches = safeCompare(
      email.trim().toLowerCase(),
      adminEmail.trim().toLowerCase(),
    );
    const passwordMatches = safeCompare(password, adminPassword);

    if (!emailMatches || !passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ role: "admin", email: adminEmail }, jwtSecret, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: { token, role: "admin" },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
