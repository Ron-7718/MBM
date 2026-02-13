import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "❌ Please define the MONGODB_URI environment variable in .env"
  );
}

let isConnected = false; // Global flag to prevent multiple connections

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // dbName: "mebookmeta",
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
