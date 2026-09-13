import { body, param, query, type ValidationChain } from "express-validator";

/* ══════════════════════════════
   UPLOAD VIDEO (POST /api/creative-videos)
   ══════════════════════════════ */

export const uploadVideoRules: ValidationChain[] = [
  body("section")
    .isIn(["pitch_alley", "ask_universe"])
    .withMessage("Section must be pitch_alley or ask_universe"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 150 })
    .withMessage("Title cannot exceed 150 characters"),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

/* ══════════════════════════════
   UPDATE VIDEO (PUT /api/creative-videos/:id)
   ══════════════════════════════ */

export const updateVideoRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid video ID format"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 150 }),

  body("description").optional({ values: "falsy" }).trim().isLength({ max: 1000 }),
];

/* ══════════════════════════════
   LIST MY VIDEOS (GET /api/creative-videos/mine)
   ══════════════════════════════ */

export const listVideosRules: ValidationChain[] = [
  query("section")
    .optional()
    .isIn(["pitch_alley", "ask_universe"])
    .withMessage("Section must be pitch_alley or ask_universe"),
];

/* ══════════════════════════════
   PARAM :id VALIDATION
   ══════════════════════════════ */

export const validateVideoId: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid video ID format"),
];
