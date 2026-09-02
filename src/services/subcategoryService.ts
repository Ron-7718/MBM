import slugify from "slugify";
import { Types } from "mongoose";
import Subcategory, { ISubcategory } from "../models/Subcategory";
import Category from "../models/Category";
import ApiError from "../utils/ApiError";

class SubcategoryService {
  /**
   * CREATE MANY — tag-style bulk create under one category, skipping duplicates.
   */
  async createSubcategories(
    categoryId: string,
    names: string[],
  ): Promise<ISubcategory[]> {
    const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound("Category not found");

    const uniqueNames = Array.from(
      new Set(names.map((n) => (n || "").trim()).filter(Boolean)),
    );
    if (uniqueNames.length === 0) {
      throw ApiError.badRequest("At least one subcategory name is required");
    }

    const slugs = uniqueNames.map((n) => slugify(n, { lower: true, strict: true }));
    const existing = await Subcategory.find({
      category: categoryId,
      slug: { $in: slugs },
    }).select("slug");
    const existingSlugs = new Set(existing.map((s) => s.slug));

    const toCreate = uniqueNames.filter(
      (n) => !existingSlugs.has(slugify(n, { lower: true, strict: true })),
    );
    if (toCreate.length === 0) {
      throw ApiError.conflict("All provided subcategories already exist");
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const docs = toCreate.map((n) => ({ name: n, category: categoryObjectId }));
    return await Subcategory.insertMany(docs);
  }

  /**
   * LIST — optionally filtered by category.
   */
  async listSubcategories(categoryId?: string): Promise<ISubcategory[]> {
    const filter = categoryId ? { category: categoryId } : {};
    return await Subcategory.find(filter)
      .populate("category", "name slug")
      .sort({ name: 1 });
  }

  /**
   * DELETE — single subcategory.
   */
  async deleteSubcategory(id: string): Promise<{ deleted: boolean; id: string }> {
    const sub = await Subcategory.findById(id);
    if (!sub) throw ApiError.notFound("Subcategory not found");

    await sub.deleteOne();
    return { deleted: true, id };
  }
}

export default new SubcategoryService();
