import type { Request, Response, NextFunction } from "express";
import creativeVideoService from "../services/creativeVideoService";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { deleteFile, getFileUrl } from "../utils/helpers";
import type { CreativeVideoSection } from "../types";

const getRequesterId = (req: Request): string | undefined =>
  (req as Request & { user?: { id?: string } }).user?.id;

/**
 * POST /api/creative-videos — upload a Pitch Alley / Ask the Universe video.
 */
export const uploadVideo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getRequesterId(req);
    if (!userId) throw ApiError.forbidden("You must be logged in to upload a video");

    const video = await creativeVideoService.uploadVideo(req.body, req.file, userId);

    ApiResponse.created(res, {
      data: video,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    if (req.file) deleteFile(getFileUrl(req.file));
    next(error);
  }
};

/**
 * GET /api/creative-videos/mine — the logged-in creative's own videos.
 */
export const listMyVideos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getRequesterId(req);
    if (!userId) throw ApiError.forbidden("You must be logged in");

    const section = req.query.section as CreativeVideoSection | undefined;
    const videos = await creativeVideoService.listMyVideos(userId, section);

    ApiResponse.success(res, {
      data: videos,
      message: "Videos retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/creative-videos/latest?section=pitch_alley|ask_universe */
export const getLatestPublicVideo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = req.query.section as CreativeVideoSection;
    if (section !== "pitch_alley" && section !== "ask_universe") {
      throw ApiError.badRequest("Section must be pitch_alley or ask_universe");
    }

    const video = await creativeVideoService.getLatestPublicVideo(section);
    ApiResponse.success(res, {
      data: video,
      message: video ? "Latest video retrieved successfully" : "No videos found",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/creative-videos/:id — update title/description.
 */
export const updateVideo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getRequesterId(req);
    if (!userId) throw ApiError.forbidden("You must be logged in");

    const video = await creativeVideoService.updateVideo(
      req.params.id,
      req.body,
      userId,
    );

    ApiResponse.success(res, {
      data: video,
      message: "Video updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/creative-videos/:id — remove a video.
 */
export const deleteVideo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getRequesterId(req);
    if (!userId) throw ApiError.forbidden("You must be logged in");

    await creativeVideoService.deleteVideo(req.params.id, userId);

    ApiResponse.success(res, { message: "Video deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/creative-videos/:id/view — record a view (public, no auth required).
 */
export const viewVideo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await creativeVideoService.incrementViews(req.params.id);

    ApiResponse.success(res, {
      data: result,
      message: "View recorded",
    });
  } catch (error) {
    next(error);
  }
};
