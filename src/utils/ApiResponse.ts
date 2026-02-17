import type { Response } from "express";
import type { IApiResponse } from "../types";

interface SuccessOpts<T> {
  data?: T | null;
  message?: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

interface PaginatedOpts<T> {
  data: T;
  page: number;
  limit: number;
  total: number;
  message?: string;
}

interface ErrorOpts {
  statusCode?: number;
  message?: string;
  errors?: string[];
}

export default class ApiResponse {
  static success<T>(res: Response, opts: SuccessOpts<T>): Response {
    const {
      data = null,
      message = "Success",
      statusCode = 200,
      meta = {},
    } = opts;
    const body: IApiResponse<T | null> = { success: true, message, data };

    if (Object.keys(meta).length > 0) {
      (body as unknown as Record<string, unknown> & { meta?: unknown }).meta =
        meta;
    }

    return res.status(statusCode).json(body);
  }

  static created<T>(
    res: Response,
    opts: { data?: T | null; message?: string },
  ): Response {
    return ApiResponse.success(res, {
      data: opts.data ?? null,
      message: opts.message ?? "Created successfully",
      statusCode: 201,
    });
  }

  static paginated<T>(res: Response, opts: PaginatedOpts<T>): Response {
    const { data, page, limit, total, message = "Success" } = opts;
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    });
  }

  static error(res: Response, opts: ErrorOpts): Response {
    const { statusCode = 500, message = "Server error", errors = [] } = opts;
    const body: IApiResponse = { success: false, message };
    if (errors.length > 0) body.errors = errors;
    return res.status(statusCode).json(body);
  }
}
