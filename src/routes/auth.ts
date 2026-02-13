import { Router } from "express";
import {
  completeProfile,
  register,
  sendLoginOtp,
  verifyOtp,
} from "../controllers/authController";

const router = Router();

// router.post("/login", login);
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", completeProfile);
router.post("/login", sendLoginOtp); // Temporary: Using register controller for login as well

export default router;
