import { Router } from "express";
import { UserStepModel } from "../models/authModel";
import Book from "../models/Book";
import CreativeVideo from "../models/CreativeVideo";
import ApiResponse from "../utils/ApiResponse";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim().slice(0, 100);
    if (query.length < 2) {
      ApiResponse.success(res, { data: { creators: [], books: [], videos: [] } });
      return;
    }

    const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [creators, books, videos] = await Promise.all([
      UserStepModel.find({ step: 4, role: { $in: ["author", "writer"] }, name: expression })
        .select("name role")
        .limit(5)
        .lean(),
      Book.find({ status: "approved", $or: [{ title: expression }, { subtitle: expression }, { description: expression }, { author: expression }, { category: expression }, { genreTags: expression }, { customTags: expression }] })
        .select("title author frontCover")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      CreativeVideo.find({ $or: [{ title: expression }, { description: expression }] })
        .select("title description userId section")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    ApiResponse.success(res, { data: { creators, books, videos } });
  } catch (error) {
    next(error);
  }
});

export default router;
