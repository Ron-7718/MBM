import type { Request, Response, NextFunction } from "express";
import subcategoryService from "../services/subcategoryService";
import ApiResponse from "../utils/ApiResponse";

/**
 * POST /api/subcategories — create multiple subcategories under one category.
 */
export const createSubcategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { category, names } = req.body as { category: string; names: string[] };
    const subcategories = await subcategoryService.createSubcategories(
      category,
      names,
    );
    ApiResponse.created(res, {
      data: subcategories,
      message: "Subcategories created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/subcategories — list subcategories, optionally filtered by category.
 */
export const listSubcategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const subcategories = await subcategoryService.listSubcategories(category);
    ApiResponse.success(res, {
      data: subcategories,
      message: "Subcategories retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/subcategories/:id — delete a subcategory.
 */
export const deleteSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await subcategoryService.deleteSubcategory(req.params.id);
    ApiResponse.success(res, {
      data: result,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
