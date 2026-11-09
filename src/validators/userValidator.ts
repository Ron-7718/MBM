import { body, param, query, type ValidationChain } from "express-validator";

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

const isOldEnough = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const birthdayHasNotPassed =
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (birthdayHasNotPassed) age -= 1;
  return age >= 13 && age <= 120;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const isAvatarReference = (value: string): boolean =>
  isHttpUrl(value) || /^\/uploads\/profile-photos\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(value);

export const updateMyProfileRules: ValidationChain[] = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage("Name must be between 3 and 80 characters"),
  body("dob")
    .custom(isOldEnough)
    .withMessage("Date of birth must be valid and you must be at least 13"),
  body("gender")
    .isIn(["male", "female", "nonbinary", "other", "prefer-not"])
    .withMessage("Choose a valid gender option"),
  body("bio").optional().trim().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
  body("avatarUrl")
    .optional({ values: "falsy" })
    .custom(isAvatarReference)
    .withMessage("Profile photo must be an HTTP or HTTPS URL or an uploaded image"),
  body("craft").optional().trim().isLength({ max: 80 }).withMessage("Craft cannot exceed 80 characters"),
  body("location").optional().trim().isLength({ max: 100 }).withMessage("Location cannot exceed 100 characters"),
  body("socialLinks")
    .isArray({ max: 8 })
    .withMessage("Add no more than 8 social links"),
  body("socialLinks.*.platform")
    .isIn(["website", "instagram", "x", "youtube", "tiktok", "goodreads"])
    .withMessage("Choose a supported social platform"),
  body("socialLinks.*.url")
    .trim()
    .custom(isHttpUrl)
    .withMessage("Social links must use an HTTP or HTTPS URL"),
];
