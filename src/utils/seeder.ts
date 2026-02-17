import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Book from "../models/Book";
import type { IBookCreateData } from "../types";

const sampleBooks: IBookCreateData[] = [
  {
    title: "The Midnight Algorithm",
    subtitle: "A tale of code and conspiracy",
    description:
      "In the neon-lit corridors of a Silicon Valley startup, a young programmer discovers an algorithm that can predict human behavior.",
    author: "Priya Sharma",
    language: "en",
    pageCount: 342,
    isbn: "978-0-123456-78-9",
    edition: "1st Edition",
    publisher: "Digital Ink Press",
    category: "Fiction",
    genreTags: ["Thriller", "Science Fiction", "Technology"],
    targetAudience: "Adults (25+)",
    copyrightType: "standard",
    copyrightYear: 2026,
    copyrightHolder: "Priya Sharma",
    price: 499,
    currency: "INR",
    allowDownload: true,
    allowPreview: true,
    isExclusive: false,
    preOrderEnabled: false,
    rightsConfirmed: true,
    termsAccepted: true,
    frontCover: "/uploads/covers/sample-front.jpg",
    manuscript: "/uploads/manuscripts/sample.pdf",
    status: "approved",
  },
  {
    title: "Whispers of the Ganges",
    description:
      "A lyrical journey through the heartland of India, exploring love, loss, and the eternal rhythm of the river.",
    author: "Arjun Mehta",
    language: "en",
    pageCount: 280,
    category: "Fiction",
    genreTags: ["Literary Fiction", "Drama", "Historical"],
    targetAudience: "General Audience",
    copyrightType: "cc-by",
    copyrightYear: 2025,
    price: 350,
    currency: "INR",
    allowDownload: true,
    allowPreview: true,
    rightsConfirmed: true,
    termsAccepted: true,
    frontCover: "/uploads/covers/sample-front-2.jpg",
    manuscript: "/uploads/manuscripts/sample-2.pdf",
    status: "pending_review",
  },
];

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("✅ Connected to MongoDB");

    await Book.deleteMany({});
    console.log("🗑️  Cleared existing books");

    const created = await Book.insertMany(sampleBooks);
    console.log(`📚 Seeded ${created.length} sample books`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder error:", (err as Error).message);
    process.exit(1);
  }
};

seed();
