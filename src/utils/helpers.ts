import fs from "fs";
import path from "path";
import type { IMulterFiles } from "../types";

/**
 * Build a URL-safe relative file path from a multer file object.
 */
export const getFileUrl = (file?: Express.Multer.File): string | null => {
  if (!file) return null;
  const folder = path.basename(path.dirname(file.path));
  return `/uploads/${folder}/${file.filename}`;
};

/**
 * Parse a value that might be a JSON array string, comma-separated string,
 * or an actual array — always returns string[].
 */
export const parseArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];

  const str = String(val);
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

/**
 * Parse boolean from form-data strings like "true", "1", etc.
 */
export const parseBool = (val: unknown): boolean => {
  if (typeof val === "boolean") return val;
  return val === "true" || val === "1";
};

/**
 * Delete a single uploaded file from disk (silent on error).
 */
export const deleteFile = (filePath?: string | null): void => {
  if (!filePath) return;
  const fullPath = filePath.startsWith("/uploads")
    ? path.join(__dirname, "..", filePath)
    : filePath;
  fs.unlink(fullPath, () => {});
};

/**
 * Cleanup all multer-uploaded files after a failed request.
 */
export const cleanupUploadedFiles = (reqFiles?: IMulterFiles): void => {
  if (!reqFiles) return;
  Object.values(reqFiles).forEach((fileArr) => {
    fileArr?.forEach((file) => {
      fs.unlink(file.path, () => {});
    });
  });
};

/**
 * Bytes → human-readable string.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
