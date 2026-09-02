import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import {
  createCategoryRules,
  validateCategoryId,
} from "../validators/categoryValidator";
import { handleValidation } from "../validators/bookValidator";
import { requireAdmin } from "../middleware/auth";

const router: Router = Router();

/* ══════════════════════════════════════════
   GET /api/categories — public list
   ══════════════════════════════════════════ */
router.get("/", categoryController.listCategories);

/* ══════════════════════════════════════════
   POST /api/categories — admin only
   ══════════════════════════════════════════ */
router.post(
  "/",
  requireAdmin,
  ...createCategoryRules,
  handleValidation,
  categoryController.createCategory,
);

/* ══════════════════════════════════════════
   DELETE /api/categories/:id — admin only
   ══════════════════════════════════════════ */
router.delete(
  "/:id",
  requireAdmin,
  ...validateCategoryId,
  handleValidation,
  categoryController.deleteCategory,
);

export default router;
