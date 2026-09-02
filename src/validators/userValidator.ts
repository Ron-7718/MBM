import { param, query, type ValidationChain } from "express-validator";

/* ══════════════════════════════
   LIST AUTHORS (GET /api/users)
   ══════════════════════════════ */

export const listAuthorsRules: ValidationChain[] = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("role")
    .optional()
    .isIn(["author", "writer"])
    .withMessage("Role must be author or writer"),
];

/* ══════════════════════════════
   PARAM :id VALIDATION
   ══════════════════════════════ */

export const validateUserId: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid user ID format"),
];
