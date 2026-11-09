import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { GridFSBucket, type GridFSFile, type ObjectId } from "mongodb";
import type { Readable } from "stream";

const BUCKET_NAME = "uploads";
let cachedBucket: GridFSBucket | null = null;

export const usesGridFsStorage = (): boolean =>
  process.env.UPLOAD_STORAGE === "gridfs" || process.env.VERCEL === "1";

export const getGridFsBucket = (): GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB must be connected before accessing uploads");

  if (!cachedBucket) cachedBucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
  return cachedBucket;
};

export const writeToGridFs = (
  source: Readable,
  folder: string,
  filename: string,
  contentType: string,
): Promise<{ id: ObjectId; size: number }> =>
  new Promise((resolve, reject) => {
    const upload = getGridFsBucket().openUploadStream(filename, {
      contentType,
      metadata: { folder, contentType },
    });

    source.once("error", (error) => {
      void upload.abort().catch(() => undefined);
      reject(error);
    });
    upload.once("error", (error) => reject(error));
    upload.once("finish", () => resolve({ id: upload.id, size: upload.length }));
    source.pipe(upload);
  });

export const saveLocalFileToGridFs = async (
  filePath: string,
  folder: string,
  filename: string,
  contentType: string,
): Promise<{ id: ObjectId; size: number }> =>
  writeToGridFs(fs.createReadStream(filePath), folder, filename, contentType);

export const findGridFsFile = async (
  folder: string,
  filename: string,
): Promise<GridFSFile | null> => {
  const files = await getGridFsBucket()
    .find({ filename, "metadata.folder": folder })
    .limit(1)
    .toArray();
  return files[0] ?? null;
};

export const removeGridFsFile = async (
  folder: string,
  filename: string,
): Promise<void> => {
  const file = await findGridFsFile(folder, filename);
  if (file) await getGridFsBucket().delete(file._id);
};

export const removeGridFsFileById = async (id: ObjectId): Promise<void> => {
  await getGridFsBucket().delete(id);
};
