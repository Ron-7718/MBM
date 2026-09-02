import { Request, Response, NextFunction } from "express";
import { listAuthors, getPublicProfileById } from "../services/userService";
import ApiResponse from "../utils/ApiResponse";
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


