import { body, param, type ValidationChain } from "express-validator";

/* ══════════════════════════════
   CREATE CATEGORY (POST /api/categories)
   ══════════════════════════════ */

export const createCategoryRules: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),
];

/* ══════════════════════════════
   PARAM :id VALIDATION
   ══════════════════════════════ */

export const validateCategoryId: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid category ID format"),
];
