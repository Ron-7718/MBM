import multer, { type FileFilterCallback } from "multer";
import path from "path";
import os from "os";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { cleanupUploadedFile } from "../utils/helpers";
import { UPLOAD_ROOT } from "../utils/uploadStorage";
import {
  removeGridFsFile,
  usesGridFsStorage,
  writeToGridFs,
} from "../utils/gridFsStorage";

/* ─────────────────────────────
   File Limits (Hardcoded)
───────────────────────────── */

const FILE_LIMITS = {
  cover: 5 * 1024 * 1024, // 5MB
  qrCode: 2 * 1024 * 1024, // 2MB
  manuscript: 500 * 1024 * 1024, // 500MB
  sample: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024, // 100MB accepted on upload, compressed down to 25MB afterwards
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_PDF_TYPES = ["application/pdf"];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
];

/* ─────────────────────────────
   Folder Mapping
───────────────────────────── */

const FOLDER_MAP: Record<string, string> = {
  frontCover: "covers",
  backCover: "covers",
  qrCode: "qrcodes",
  manuscript: "manuscripts",
  samplePdf: "samples",
  video: "videos",
  image: "community-posts",
  avatar: "profile-photos",
};

const uploadExtension = (file: Express.Multer.File): string => {
  if (file.fieldname !== "avatar") return path.extname(file.originalname).toLowerCase();
  const avatarExtensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return avatarExtensions[file.mimetype] ?? ".img";
};

/* ─────────────────────────────
   Storage Engine
───────────────────────────── */

const diskStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = FOLDER_MAP[file.fieldname] ?? "others";
    const root = usesGridFsStorage() && file.fieldname === "video"
      ? path.join(os.tmpdir(), "mbm-uploads")
      : UPLOAD_ROOT;
    const uploadPath = path.join(root, folder);

    // Auto-create folder if missing
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    const ext = uploadExtension(file);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const storage: multer.StorageEngine = {
  _handleFile: (req, file, cb) => {
    if (!usesGridFsStorage() || file.fieldname === "video") {
      return diskStorage._handleFile(req, file, cb);
    }

    const folder = FOLDER_MAP[file.fieldname] ?? "others";
    const filename = `${uuidv4()}${uploadExtension(file)}`;
    const publicPath = `/uploads/${folder}/${filename}`;

    writeToGridFs(file.stream, folder, filename, file.mimetype)
      .then(({ size }) => cb(null, {
        destination: "",
        filename,
        path: publicPath,
        size,
      }))
      .catch((error: Error) => cb(error));
  },

  _removeFile: (req, file, cb) => {
    const match = file.path?.replace(/\\/g, "/").match(/^\/uploads\/([^/]+)\/([^/]+)$/);
    if (!match || !usesGridFsStorage()) {
      return diskStorage._removeFile(req, file, cb);
    }

    removeGridFsFile(match[1], match[2]).then(() => cb(null)).catch(cb);
  },
};

/* ─────────────────────────────
   File Filter
───────────────────────────── */

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const imageFields = ["frontCover", "backCover", "qrCode", "image", "avatar"];
  const pdfFields = ["manuscript", "samplePdf"];
  const videoFields = ["video"];

  if (imageFields.includes(file.fieldname)) {
    const allowedTypes = file.fieldname === "image" || file.fieldname === "avatar"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ALLOWED_IMAGE_TYPES;
    if (allowedTypes.includes(file.mimetype)) {
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

  if (videoFields.includes(file.fieldname)) {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new ApiError(
        400,
        `${file.fieldname}: Only video files (mp4, mov, webm, mkv, avi) are allowed`,
      ),
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
   Video Upload (Pitch Alley / Ask the Universe)
───────────────────────────── */

export const videoUploadField = upload.single("video");

const communityImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const communityPostImageField = communityImageUpload.single("image");

const profilePhotoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export const profilePhotoUploadField = profilePhotoUpload.single("avatar");

export const validateVideoSize = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const file = req.file;
  if (!file) return next();

  if (file.size > FILE_LIMITS.video) {
    const limitMB = (FILE_LIMITS.video / 1048576).toFixed(0);
    const actualMB = (file.size / 1048576).toFixed(2);
    fs.unlink(file.path, () => {});
    return next(
      ApiError.badRequest(
        `video: File size ${actualMB}MB exceeds limit of ${limitMB}MB`,
      ),
    );
  }

  next();
};

/* ─────────────────────────────
   Per-field Size Validation
───────────────────────────── */

export const validateFileSizes = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
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
  const invalidFiles: Express.Multer.File[] = [];

  for (const field in files) {
    for (const file of files[field]) {
      const limit = sizeMap[field];

      if (limit && file.size > limit) {
        const limitMB = (limit / 1048576).toFixed(0);
        const actualMB = (file.size / 1048576).toFixed(2);

        errors.push(
          `${field}: File size ${actualMB}MB exceeds limit of ${limitMB}MB`,
        );

        invalidFiles.push(file);
      }
    }
  }

  if (errors.length > 0) {
    await Promise.all(invalidFiles.map((file) => cleanupUploadedFile(file)));
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
