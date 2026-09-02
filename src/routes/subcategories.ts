import { Router } from "express";
import * as subcategoryController from "../controllers/subcategoryController";
import {
  createSubcategoriesRules,
  listSubcategoriesRules,
  validateSubcategoryId,
} from "../validators/subcategoryValidator";
import { handleValidation } from "../validators/bookValidator";
import { requireAdmin } from "../middleware/auth";

const router: Router = Router();

/* ══════════════════════════════════════════
   GET /api/subcategories — public list (optionally by ?category=)
   ══════════════════════════════════════════ */
router.get(
  "/",
  ...listSubcategoriesRules,
  handleValidation,
  subcategoryController.listSubcategories,
);

/* ══════════════════════════════════════════
   POST /api/subcategories — admin only, bulk tag-style create
   ══════════════════════════════════════════ */
router.post(
  "/",
  requireAdmin,
  ...createSubcategoriesRules,
  handleValidation,
  subcategoryController.createSubcategories,
);

/* ══════════════════════════════════════════
   DELETE /api/subcategories/:id — admin only
   ══════════════════════════════════════════ */
router.delete(
  "/:id",
  requireAdmin,
  ...validateSubcategoryId,
  handleValidation,
  subcategoryController.deleteSubcategory,
);

export default router;
