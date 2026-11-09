import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import bookRouter from "./routes/books";
import categoryRouter from "./routes/categories";
import subcategoryRouter from "./routes/subcategories";
import adminAuthRouter from "./routes/adminAuth";
import creativeVideoRouter from "./routes/creativeVideos";
import searchRouter from "./routes/search";
import communityPostsRouter from "./routes/communityPosts";
import { corsMiddleware } from "./middleware/cors";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFound } from "./middleware/errorHandler";
import dns from "node:dns";
import { UPLOAD_ROOT } from "./utils/uploadStorage";
import {
  findGridFsFile,
  getGridFsBucket,
  usesGridFsStorage,
} from "./utils/gridFsStorage";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Reuse the connection across requests handled by the same Vercel instance.
let mongoConnection: Promise<typeof mongoose> | null = null;

const connectToMongo = (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);

  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error("MONGODB_URI is not configured"));
  }

  if (!mongoConnection) {
    mongoConnection = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        mongoConnection = null;
        throw error;
      });
  }

  return mongoConnection;
};

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.get("/", (_req, res) => {
  res.json({ message: "MeBookMeta Backend is running!" });
});

// Health stays usable during database outages; all data routes wait for Mongo.
app.use("/api/health", healthRouter);
app.use(async (_req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(503).json({
      success: false,
      message: "Database is unavailable. Check the MONGODB_URI configuration.",
    });
  }
});

// Local disk uploads work for local development and persistent Node hosts.
// Vercel deployments need object storage for uploaded files.
app.use("/uploads", express.static(UPLOAD_ROOT));
app.get("/uploads/:folder/:filename", async (req, res, next) => {
  if (!usesGridFsStorage()) return next();

  try {
    const { folder, filename } = req.params;
    const file = await findGridFsFile(folder, filename);
    if (!file) return next();

    const size = file.length;
    const range = req.header("range")?.match(/^bytes=(\d*)-(\d*)$/);
    let start: number | undefined;
    let end: number | undefined;

    if (range) {
      if (range[1]) {
        start = Number(range[1]);
        end = range[2] ? Number(range[2]) : size - 1;
      } else {
        const suffixLength = Number(range[2]);
        start = Math.max(0, size - suffixLength);
        end = size - 1;
      }

      if (start >= size || end < start) {
        res.setHeader("Content-Range", `bytes */${size}`);
        return res.status(416).end();
      }
      end = Math.min(end, size - 1);
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      res.setHeader("Content-Length", end - start + 1);
    } else {
      res.setHeader("Content-Length", size);
    }

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader(
      "Content-Type",
      file.metadata?.contentType || "application/octet-stream",
    );

    const stream = getGridFsBucket().openDownloadStream(file._id, {
      ...(start !== undefined ? { start } : {}),
      ...(end !== undefined ? { end: end + 1 } : {}),
    });
    stream.on("error", next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subcategories", subcategoryRouter);
app.use("/api/creative-videos", creativeVideoRouter);
app.use("/api/search", searchRouter);
app.use("/api/community-posts", communityPostsRouter);

app.use(errorHandler);
app.use(notFound);

mongoose.connection.on("disconnected", () =>
  console.warn("MongoDB disconnected; the next request will reconnect."),
);
mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"));
mongoose.connection.on("error", (error) =>
  console.error("MongoDB connection error:", error),
);

// Vercel imports the default app export; local npm start still opens a port.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
