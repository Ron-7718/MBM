import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import bookRouter from "./routes/books";
import { corsMiddleware } from "./middleware/cors";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFound } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Database connection (mongoose)
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("⚠️ MONGO_URI is not set. Skipping MongoDB connection.");
}

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "MeBookMeta Backend is running!" });
});

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use(notFound);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
