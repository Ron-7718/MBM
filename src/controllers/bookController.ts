import type { Request, Response, NextFunction } from "express";
import bookService from "../services/bookService";
import ApiResponse from "../utils/ApiResponse";
import { cleanupUploadedFiles } from "../utils/helpers";
import type { IMulterFiles, IBookListQuery } from "../types";

const getRequesterId = (req: Request): string | undefined =>
  (req as Request & { user?: { id?: string } }).user?.id;

/**
 * POST /api/books — submit new book for review.
 */
export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const files = req.files as IMulterFiles | undefined;
    const book = await bookService.createBook(req.body, files, getRequesterId(req));

    ApiResponse.created(res, {
      data: book,
      message: "Book submitted successfully for review",
    });
  } catch (error) {
    cleanupUploadedFiles(req.files as IMulterFiles | undefined);
    next(error);
  }
};

/**
 * POST /api/books/draft — save as draft.
 */
export const saveDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const files = req.files as IMulterFiles | undefined;
    const draft = await bookService.saveDraft(req.body, files, getRequesterId(req));

    ApiResponse.created(res, {
      data: draft,
      message: "Draft saved successfully",
    });
  } catch (error) {
    cleanupUploadedFiles(req.files as IMulterFiles | undefined);
    next(error);
  }
};

/**
 * GET /api/books — list books (paginated).
 */
export const listBooks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as unknown as IBookListQuery;

    // "mine" only ever resolves to the verified caller's own id — never a client-supplied
    // userId — otherwise anyone could enumerate another user's drafts/rejected books.
    if (req.query.mine === "true") {
      query.userId = getRequesterId(req);
    } else {
      delete query.userId;
    }

    const { books, total, page, limit } = await bookService.listBooks(query);

    ApiResponse.paginated(res, {
      data: books,
      page,
      limit,
      total,
      message: "Books retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/stats — dashboard statistics.
 */
export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await bookService.getStats();

    ApiResponse.success(res, {
      data: stats,
      message: "Stats retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/slug/:slug — get by URL slug.
 */
export const getBookBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const book = await bookService.getBookBySlug(req.params.slug);

    ApiResponse.success(res, {
      data: book,
      message: "Book retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id — get single book.
 */
export const getBookById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const book = await bookService.getBookById(req.params.id);

    ApiResponse.success(res, {
      data: book,
      message: "Book retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/books/:id — update book.
 */
export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const files = req.files as IMulterFiles | undefined;
    const book = await bookService.updateBook(
      req.params.id,
      req.body,
      files,
      getRequesterId(req),
    );

    ApiResponse.success(res, {
      data: book,
      message: "Book updated successfully",
    });
  } catch (error) {
    cleanupUploadedFiles(req.files as IMulterFiles | undefined);
    next(error);
  }
};

/**
 * PATCH /api/books/:id/status — change status.
 */
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, rejectionReason } = req.body as {
      status: string;
      rejectionReason?: string;
    };
    const book = await bookService.updateStatus(
      req.params.id,
      status,
      rejectionReason,
    );

    ApiResponse.success(res, {
      data: book,
      message: `Book status updated to "${status}"`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/books/:id — delete book + files.
 */
export const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await bookService.deleteBook(req.params.id, getRequesterId(req));

    ApiResponse.success(res, {
      data: result,
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
