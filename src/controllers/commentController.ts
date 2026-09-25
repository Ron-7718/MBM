import type { Request, Response, NextFunction } from "express";
import commentService from "../services/commentService";
import ApiResponse from "../utils/ApiResponse";

const getRequesterId = (req: Request): string | undefined =>
  (req as Request & { user?: { id?: string } }).user?.id;

const getRequesterName = (req: Request): string | undefined =>
  (req as Request & { user?: { name?: string } }).user?.name;

/**
 * POST /api/books/:id/comments — add a comment to a book.
 */
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getRequesterId(req);
    if (!userId) {
      ApiResponse.error(res, { statusCode: 403, message: "You must be logged in to comment" });
      return;
    }

    const comment = await commentService.addComment(
      req.params.id,
      userId,
      getRequesterName(req),
      req.body.text,
    );

    ApiResponse.created(res, { data: comment, message: "Comment added" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id/comments — list comments for a book.
 */
export const listComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const { comments, total, page: p, limit: l } = await commentService.listComments(
      req.params.id,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );

    ApiResponse.paginated(res, {
      data: comments,
      page: p,
      limit: l,
      total,
      message: "Comments retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};
