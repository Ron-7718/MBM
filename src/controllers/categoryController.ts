import type { Request, Response, NextFunction } from "express";
import categoryService from "../services/categoryService";
import ApiResponse from "../utils/ApiResponse";

/**
 * POST /api/categories — create a category.
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await categoryService.createCategory(req.body.name);
    ApiResponse.created(res, {
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories — list all categories.
 */
export const listCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categories = await categoryService.listCategories();
    ApiResponse.success(res, {
      data: categories,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id — delete a category and its subcategories.
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    ApiResponse.success(res, {
      data: result,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
