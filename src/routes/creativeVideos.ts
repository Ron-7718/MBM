import { Router } from "express";
import * as creativeVideoController from "../controllers/creativeVideoController";
import {
  videoUploadField,
  validateVideoSize,
  handleMulterError,
} from "../middleware/upload";
import { uploadLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middleware/auth";
import {
  uploadVideoRules,
  updateVideoRules,
  validateVideoId,
  listVideosRules,
} from "../validators/creativeVideoValidator";
import { handleValidation } from "../validators/bookValidator";

const router: Router = Router();

/* ══════════════════════════════════════════
   POST /api/creative-videos — upload a pitch / ask-the-universe video
   ══════════════════════════════════════════ */
router.post(
  "/",
  uploadLimiter,
  requireAuth,
  videoUploadField,
  handleMulterError,
  validateVideoSize,
  ...uploadVideoRules,
  handleValidation,
  creativeVideoController.uploadVideo,
);

/* ══════════════════════════════════════════
   GET /api/creative-videos/mine — the logged-in creative's own videos
   ══════════════════════════════════════════ */
router.get(
  "/mine",
  requireAuth,
  ...listVideosRules,
  handleValidation,
  creativeVideoController.listMyVideos,
);

/* ══════════════════════════════════════════
   PUT /api/creative-videos/:id — update title/description
   ══════════════════════════════════════════ */
router.put(
  "/:id",
  requireAuth,
  ...updateVideoRules,
  handleValidation,
  creativeVideoController.updateVideo,
);

/* ══════════════════════════════════════════
   DELETE /api/creative-videos/:id — remove a video
   ══════════════════════════════════════════ */
router.delete(
  "/:id",
  requireAuth,
  ...validateVideoId,
  handleValidation,
  creativeVideoController.deleteVideo,
);

/* ══════════════════════════════════════════
   POST /api/creative-videos/:id/view — record a view (public)
   ══════════════════════════════════════════ */
router.post(
  "/:id/view",
  ...validateVideoId,
  handleValidation,
  creativeVideoController.viewVideo,
);

export default router;
