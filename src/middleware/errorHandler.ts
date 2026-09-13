import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Something went wrong";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message,
    errors: Array.isArray(err.errors) && err.errors.length > 0 ? err.errors : undefined,
  });
}
