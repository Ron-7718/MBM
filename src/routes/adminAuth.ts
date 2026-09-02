import { Router } from "express";
import { adminLogin } from "../controllers/adminAuthController";
import { authLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

router.post("/login", authLimiter, adminLogin);

export default router;
