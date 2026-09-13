import { Router } from "express";
import * as bookController from "../controllers/bookController";
import {
  bookUploadFields,
  validateFileSizes,
  handleMulterError,
} from "../middleware/upload";
import { uploadLimiter } from "../middleware/rateLimiter";
import { optionalAuth } from "../middleware/auth";
import {
  submitBookRules,
  updateBookRules,
  listBooksRules,
  validateId,
  updateStatusRules,
  handleValidation,
} from "../validators/bookValidator";

const router: Router = Router();

/* ══════════════════════════════════════════
   POST /api/books — Submit new book
   ══════════════════════════════════════════ */
router.post(
  "/",
  uploadLimiter,
  optionalAuth,
  bookUploadFields,
  handleMulterError,
  validateFileSizes,
  ...submitBookRules,
  handleValidation,
  bookController.createBook,
);

/* ══════════════════════════════════════════
   POST /api/books/draft — Save as draft
   ══════════════════════════════════════════ */
router.post(
  "/draft",
  uploadLimiter,
  optionalAuth,
  bookUploadFields,
  handleMulterError,
  validateFileSizes,
  bookController.saveDraft,
);

/* ══════════════════════════════════════════
   GET /api/books — List books (paginated)
   ══════════════════════════════════════════ */
router.get(
  "/",
  optionalAuth,
  ...listBooksRules,
  handleValidation,
  bookController.listBooks,
);

/* ══════════════════════════════════════════
   GET /api/books/stats — Dashboard stats
   ══════════════════════════════════════════ */
router.get("/stats", bookController.getStats);

/* ══════════════════════════════════════════
   GET /api/books/slug/:slug — Get by slug
   ══════════════════════════════════════════ */
router.get("/slug/:slug", bookController.getBookBySlug);

/* ══════════════════════════════════════════
   GET /api/books/:id — Get single book
   ══════════════════════════════════════════ */
router.get("/:id", ...validateId, handleValidation, bookController.getBookById);

/* ══════════════════════════════════════════
   PUT /api/books/:id — Update book
   ══════════════════════════════════════════ */
router.put(
  "/:id",
  uploadLimiter,
  optionalAuth,
  bookUploadFields,
  handleMulterError,
  validateFileSizes,
  ...validateId,
  ...updateBookRules,
  handleValidation,
  bookController.updateBook,
);

/* ══════════════════════════════════════════
   PATCH /api/books/:id/status — Change status
   ══════════════════════════════════════════ */
router.patch(
  "/:id/status",
  ...updateStatusRules,
  handleValidation,
  bookController.updateStatus,
);

/* ══════════════════════════════════════════
   DELETE /api/books/:id — Delete book
   ══════════════════════════════════════════ */
router.delete(
  "/:id",
  optionalAuth,
  ...validateId,
  handleValidation,
  bookController.deleteBook,
);

export default router;
