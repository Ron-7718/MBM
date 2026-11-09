import "dotenv/config";
import path from "path";

/**
 * Resolve the shared upload directory independently of the launch directory.
 * Set UPLOAD_DIR to a persistent mounted directory in production.
 */
const configuredUploadDir = process.env.UPLOAD_DIR;

export const UPLOAD_ROOT = configuredUploadDir
  ? path.resolve(configuredUploadDir)
  : path.resolve(__dirname, "../../uploads");

export const getUploadedFilePath = (relativePath: string): string | null => {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) {
    return null;
  }

  const target = path.resolve(UPLOAD_ROOT, normalized);
  const relativeTarget = path.relative(UPLOAD_ROOT, target);
  if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    return null;
  }

  return target;
};
