import { body, param, query, type ValidationChain } from "express-validator";

/* ══════════════════════════════
   CREATE SUBCATEGORIES (POST /api/subcategories)
   ══════════════════════════════ */

export const createSubcategoriesRules: ValidationChain[] = [
  body("category").isMongoId().withMessage("Valid category ID is required"),

  body("names")
    .isArray({ min: 1 })
    .withMessage("At least one subcategory name is required"),

  body("names.*")
    .trim()
    .notEmpty()
    .withMessage("Subcategory name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Subcategory name cannot exceed 100 characters"),
];

/* ══════════════════════════════
   LIST SUBCATEGORIES (GET /api/subcategories)
   ══════════════════════════════ */

export const listSubcategoriesRules: ValidationChain[] = [
  query("category").optional().isMongoId().withMessage("Invalid category ID format"),
];

/* ══════════════════════════════
   PARAM :id VALIDATION
   ══════════════════════════════ */

export const validateSubcategoryId: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid subcategory ID format"),
];
