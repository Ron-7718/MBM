import {
  body,
  param,
  query,
  validationResult,
  type ValidationChain,
} from "express-validator";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

/* ══════════════════════════════
   SUBMIT BOOK (POST /api/books)
   ══════════════════════════════ */

export const submitBookRules: ValidationChain[] = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Book title is required")
    .isLength({ max: 300 })
    .withMessage("Title cannot exceed 300 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("author")
    .trim()
    .notEmpty()
    .withMessage("Author name is required")
    .isLength({ max: 200 })
    .withMessage("Author name cannot exceed 200 characters"),

  body("category").trim().notEmpty().withMessage("Category is required"),

  body("language")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Language cannot be empty"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be 0 or greater"),

  body("pageCount")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Page count must be at least 1"),

  body("isbn")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("ISBN cannot exceed 20 characters"),

  body("copyrightYear")
    .optional({ values: "falsy" })
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Copyright year must be between 1900 and 2100"),

  body("rightsConfirmed")
    .custom((val: unknown) => val === "true" || val === true)
    .withMessage("You must confirm that you hold publishing rights"),

  body("termsAccepted")
    .custom((val: unknown) => val === "true" || val === true)
    .withMessage("You must accept the Terms of Service"),
];

/* ══════════════════════════════
   UPDATE BOOK (PUT /api/books/:id)
   ══════════════════════════════ */

export const updateBookRules: ValidationChain[] = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 300 }),

  body("description").optional().trim().isLength({ max: 2000 }),

  body("author").optional().trim().notEmpty().isLength({ max: 200 }),

  body("price").optional().isFloat({ min: 0 }),

  body("pageCount").optional({ values: "falsy" }).isInt({ min: 1 }),

  body("copyrightYear")
    .optional({ values: "falsy" })
    .isInt({ min: 1900, max: 2100 }),
];

/* ══════════════════════════════
   LIST BOOKS (GET /api/books)
   ══════════════════════════════ */

export const listBooksRules: ValidationChain[] = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "title", "price", "viewCount", "downloadCount"])
    .withMessage("Invalid sort field"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be asc or desc"),
];

/* ══════════════════════════════
   PARAM :id VALIDATION
   ══════════════════════════════ */

export const validateId: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid book ID format"),
];

/* ══════════════════════════════
   STATUS CHANGE (PATCH /api/books/:id/status)
   ══════════════════════════════ */

export const updateStatusRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid book ID format"),
  body("status")
    .isIn(["draft", "pending_review", "approved", "rejected", "archived"])
    .withMessage("Invalid status value"),
  body("rejectionReason")
    .if(body("status").equals("rejected"))
    .notEmpty()
    .withMessage("Rejection reason is required when rejecting a book"),
];

/* ══════════════════════════════
   VALIDATION RESULT HANDLER
   ══════════════════════════════ */

export const handleValidation = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg as string);
    throw ApiError.validationFailed(messages);
  }
  next();
};
