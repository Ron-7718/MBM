import slugify from "slugify";
import Category, { ICategory } from "../models/Category";
import Subcategory from "../models/Subcategory";
import ApiError from "../utils/ApiError";

class CategoryService {
  /**
   * CREATE — add a new category.
   */
  async createCategory(name: string): Promise<ICategory> {
    const trimmed = (name || "").trim();
    if (!trimmed) throw ApiError.badRequest("Category name is required");

    const slug = slugify(trimmed, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (existing) throw ApiError.conflict("Category already exists");

    return await Category.create({ name: trimmed });
  }

  /**
   * LIST — all categories, alphabetical.
   */
  async listCategories(): Promise<ICategory[]> {
    return await Category.find().sort({ name: 1 });
  }

  /**
   * DELETE — removes the category and its subcategories.
   */
  async deleteCategory(id: string): Promise<{ deleted: boolean; id: string }> {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound("Category not found");

    await Subcategory.deleteMany({ category: id });
    await category.deleteOne();

    return { deleted: true, id };
  }
}

export default new CategoryService();
