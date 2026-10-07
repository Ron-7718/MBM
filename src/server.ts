import express from "express";
import cors from "cors";
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
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "MeBookMeta Backend is running!" });
});

// Serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subcategories", subcategoryRouter);
app.use("/api/creative-videos", creativeVideoRouter);
app.use("/api/search", searchRouter);
app.use("/api/community-posts", communityPostsRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use(notFound);

// Reconnection visibility — queries otherwise silently buffer until they time out.
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️ MongoDB disconnected — queries will buffer until reconnected"),
);
mongoose.connection.on("reconnected", () => console.log("✅ MongoDB reconnected"));
mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err));

// Database connection must be ready before the server accepts requests,
// otherwise early requests buffer and fail with a timeout error.
const start = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGODB_URI;

  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1);
    }
  } else {
    console.warn("⚠️ MONGO_URI is not set. Skipping MongoDB connection.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();


export default app;
