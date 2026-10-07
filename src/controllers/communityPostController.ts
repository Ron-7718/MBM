import type { Request, Response, NextFunction } from "express";
import communityPostService from "../services/communityPostService";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

const requester = (req: Request): string | undefined => (req as Request & { user?: { id?: string } }).user?.id;

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requester(req);
    if (!userId) throw ApiError.forbidden("You must be logged in to post");
    const post = await communityPostService.create(req.body, req.file, userId);
    ApiResponse.created(res, { data: post, message: "Post created successfully" });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await communityPostService.list({
      userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
      viewerId: requester(req),
      limit: Number(req.query.limit) || 30,
    });
    ApiResponse.success(res, { data: posts, message: "Posts retrieved successfully" });
  } catch (error) { next(error); }
};

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requester(req);
    if (!userId) throw ApiError.forbidden("You must be logged in to like posts");
    const result = await communityPostService.toggleLike(req.params.id, userId);
    ApiResponse.success(res, { data: result, message: result.liked ? "Post liked" : "Like removed" });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requester(req);
    if (!userId) throw ApiError.forbidden("You must be logged in");
    await communityPostService.delete(req.params.id, userId);
    ApiResponse.success(res, { message: "Post deleted successfully" });
  } catch (error) { next(error); }
};
