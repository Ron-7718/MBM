import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

/* ─────────────────────────────
   File Limits (Hardcoded)
───────────────────────────── */

const FILE_LIMITS = {
  cover: 5 * 1024 * 1024, // 5MB
  qrCode: 2 * 1024 * 1024, // 2MB
  manuscript: 500 * 1024 * 1024, // 500MB
  sample: 20 * 1024 * 1024, // 20MB
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_PDF_TYPES = ["application/pdf"];

/* ─────────────────────────────
   Folder Mapping
───────────────────────────── */

const FOLDER_MAP: Record<string, string> = {
  frontCover: "covers",
  backCover: "covers",
  qrCode: "qrcodes",
  manuscript: "manuscripts",
  samplePdf: "samples",
};

/* ─────────────────────────────
   Storage Engine
───────────────────────────── */

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = FOLDER_MAP[file.fieldname] ?? "others";
    const uploadPath = path.join(process.cwd(), "uploads", folder);

    // Auto-create folder if missing
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

/* ─────────────────────────────
   File Filter
───────────────────────────── */

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const imageFields = ["frontCover", "backCover", "qrCode"];
  const pdfFields = ["manuscript", "samplePdf"];

  if (imageFields.includes(file.fieldname)) {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new ApiError(400, `${file.fieldname}: Only image files are allowed`),
    );
  }

  if (pdfFields.includes(file.fieldname)) {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new ApiError(400, `${file.fieldname}: Only PDF files are allowed`),
    );
  }

  return cb(new ApiError(400, `Unexpected file field: ${file.fieldname}`));
};

/* ─────────────────────────────
   Multer Instance
───────────────────────────── */

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_LIMITS.manuscript,
    files: 5,
  },
});

/* ─────────────────────────────
   Expected Fields
───────────────────────────── */

export const bookUploadFields = upload.fields([
  { name: "frontCover", maxCount: 1 },
  { name: "backCover", maxCount: 1 },
  { name: "qrCode", maxCount: 1 },
  { name: "manuscript", maxCount: 1 },
  { name: "samplePdf", maxCount: 1 },
]);

/* ─────────────────────────────
   Per-field Size Validation
───────────────────────────── */

export const validateFileSizes = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  if (!files) return next();

  const sizeMap: Record<string, number> = {
    frontCover: FILE_LIMITS.cover,
    backCover: FILE_LIMITS.cover,
    qrCode: FILE_LIMITS.qrCode,
    manuscript: FILE_LIMITS.manuscript,
    samplePdf: FILE_LIMITS.sample,
  };

  const errors: string[] = [];

  for (const field in files) {
    for (const file of files[field]) {
      const limit = sizeMap[field];

      if (limit && file.size > limit) {
        const limitMB = (limit / 1048576).toFixed(0);
        const actualMB = (file.size / 1048576).toFixed(2);

        errors.push(
          `${field}: File size ${actualMB}MB exceeds limit of ${limitMB}MB`,
        );

        fs.unlink(file.path, () => {});
      }
    }
  }

  if (errors.length > 0) {
    return next(ApiError.validationFailed(errors));
  }

  next();
};

/* ─────────────────────────────
   Multer Error Handler
───────────────────────────── */

export const handleMulterError = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return next(ApiError.badRequest("File size exceeds maximum limit"));
      case "LIMIT_FILE_COUNT":
        return next(ApiError.badRequest("Too many files uploaded"));
      case "LIMIT_UNEXPECTED_FILE":
        return next(ApiError.badRequest(`Unexpected file field: ${err.field}`));
      default:
        return next(ApiError.badRequest(err.message));
    }
  }

  if (err instanceof ApiError) return next(err);
  if (err instanceof Error) return next(ApiError.badRequest(err.message));

  next();
};
