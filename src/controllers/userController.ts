import { Request, Response, NextFunction } from "express";
import {
  getMyProfileById,
  listAuthors,
  getPublicProfileById,
  updateMyProfileById,
} from "../services/userService";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { cleanupUploadedFile, getFileUrl } from "../utils/helpers";
import type { IUserListQuery } from "../types";

/**
 * GET /api/users — public creator directory (authors/writers only).
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as IUserListQuery;
    const { users, total, page, limit } = await listAuthors(query);

    ApiResponse.paginated(res, {
      data: users,
      page,
      limit,
      total,
      message: "Authors retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id — public author/writer profile with their works.
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await getPublicProfileById(req.params.id);

    ApiResponse.success(res, {
      data: profile,
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
}

function getAuthenticatedUserId(req: Request): string {
  const id = (req as Request & { user?: { id?: string } }).user?.id;
  if (!id) throw new ApiError(401, "Unauthorized");
  return id;
}

/** GET /api/users/me — private editable profile details. */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await getMyProfileById(getAuthenticatedUserId(req));
    ApiResponse.success(res, { data: profile, message: "Profile retrieved successfully" });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/users/me — updates only the authenticated user's profile fields. */
export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const avatarUrl = getFileUrl(req.file);
    const profile = await updateMyProfileById(
      getAuthenticatedUserId(req),
      { ...req.body, ...(avatarUrl ? { avatarUrl } : {}) },
    );
    ApiResponse.success(res, { data: profile, message: "Profile saved successfully" });
  } catch (error) {
    await cleanupUploadedFile(req.file);
    next(error);
  }
}


