import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(status).json({ error: message });
}
