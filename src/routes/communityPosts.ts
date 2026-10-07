import { Router } from "express";
import * as controller from "../controllers/communityPostController";
import { communityPostImageField, handleMulterError } from "../middleware/upload";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";

const router: Router = Router();
router.get("/", optionalAuth, controller.list);
router.post("/", uploadLimiter, requireAuth, communityPostImageField, handleMulterError, controller.create);
router.post("/:id/like", requireAuth, controller.toggleLike);
router.delete("/:id", requireAuth, controller.remove);
export default router;
