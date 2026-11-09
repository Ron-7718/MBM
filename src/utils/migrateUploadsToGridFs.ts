import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dns from "node:dns";
import Book from "../models/Book";
import CommunityPost from "../models/CommunityPost";
import CreativeVideo from "../models/CreativeVideo";
import { getUploadedFilePath } from "./uploadStorage";
import { findGridFsFile, writeToGridFs } from "./gridFsStorage";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const contentTypeFor = (filename: string): string => {
  const extension = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mkv": "video/x-matroska",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webm": "video/webm",
    ".webp": "image/webp",
  };
  return types[extension] ?? "application/octet-stream";
};

const toGridFsKey = (value?: string | null): { folder: string; filename: string } | null => {
  if (!value) return null;
  let pathname = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      pathname = new URL(value).pathname;
    } catch {
      return null;
    }
  }

  const match = pathname.replace(/\\/g, "/").match(/^\/uploads\/([^/]+)\/([^/]+)$/);
  return match ? { folder: match[1], filename: match[2] } : null;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    const [books, posts, videos] = await Promise.all([
      Book.find().select("frontCover backCover qrCode manuscript samplePdf").lean(),
      CommunityPost.find().select("imageUrl").lean(),
      CreativeVideo.find().select("videoUrl").lean(),
    ]);

    const references = [
      ...books.flatMap((book) => [book.frontCover, book.backCover, book.qrCode, book.manuscript, book.samplePdf]),
      ...posts.map((post) => post.imageUrl),
      ...videos.map((video) => video.videoUrl),
    ];
    const uniqueFiles = new Map<string, { folder: string; filename: string }>();
    for (const value of references) {
      const key = toGridFsKey(value);
      if (key) uniqueFiles.set(`${key.folder}/${key.filename}`, key);
    }

    const apply = process.argv.includes("--apply");
    let copied = 0;
    let skipped = 0;
    let missing = 0;
    let bytes = 0;

    for (const [key, file] of uniqueFiles) {
      if (await findGridFsFile(file.folder, file.filename)) {
        skipped += 1;
        continue;
      }

      const localPath = getUploadedFilePath(key);
      if (!localPath || !fs.existsSync(localPath)) {
        missing += 1;
        console.warn(`Missing locally: /uploads/${key}`);
        continue;
      }

      const size = fs.statSync(localPath).size;
      if (apply) {
        await writeToGridFs(
          fs.createReadStream(localPath),
          file.folder,
          file.filename,
          contentTypeFor(file.filename),
        );
      }
      copied += 1;
      bytes += size;
    }

    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", referencedFiles: uniqueFiles.size, copied, alreadyInGridFs: skipped, missingLocally: missing, bytesToCopy: bytes }));
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error: unknown) => {
  console.error("Upload migration failed:", error);
  process.exitCode = 1;
});
