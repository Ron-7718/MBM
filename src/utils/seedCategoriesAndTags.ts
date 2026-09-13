import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import slugify from "slugify";
import Category from "../models/Category";
import Subcategory from "../models/Subcategory";

/**
 * Category → tag map. "Auther" (matches the signup role label's spelling)
 * and "Writer" are separate categories so each signup role gets its own
 * admin-managed tag list; every other category feeds the frontend's
 * "Other Tags" fallback.
 */
const CATEGORY_TAGS: Record<string, string[]> = {
  Auther: [
    "African American & Black",
    "Asian American",
    "Christian",
    "Coming of Age",
    "Crime",
    "Family Life",
    "Fantasy",
    "Feminist",
    "Friendship",
    "Ghost",
    "Gothic",
    "Graphic Novels",
    "Historical",
    "Holidays",
    "Horror",
    "Humorous",
    "Indigenous",
    "Jewish",
    "Juvenile",
    "Legal",
    "LBGTQ+",
    "Literary",
    "Magical Realism",
    "Mashups",
    "Medical",
    "Metaphysical",
    "Muslim",
    "Mystery & Detective",
    "Mythology",
    "Native American",
    "Nature & the Environment",
    "Performing Arts",
    "Political",
    "Psychological",
    "Religious",
    "Romance",
    "Satire",
    "Science Fiction",
    "Short Stories",
    "Small Towns & Rural",
    "Southern",
    "Sports",
    "Suspense",
    "Thrillers/Terrorism",
    "Urban & Street Lit",
    "Westerns",
    "Women's",
    "World Literature",
  ],
  Writer: [
    "Architecture",
    "Art",
    "Autobiography & Biography",
    "Body, Mind, Spirit",
    "Business & Economics",
    "Comics and Graphic Novels",
    "Computers",
    "Cooking",
    "Design",
    "Drama",
    "Education",
    "Family & Relationships",
    "Foreign Language",
    "Games & Activities",
    "Gardening",
    "Health & Fitness",
    "History",
    "House & Home",
    "Humor",
    "Juvenile",
    "Language Arts & Discipline",
    "Law",
    "Literary Collections",
    "Literary Criticism",
    "Mathematics",
    "Medical",
    "Music",
    "Nature",
    "Performing Arts",
    "Pets",
    "Philosophy",
    "Photography",
    "Poetry",
    "Political Science",
    "Psychology",
    "Reference",
    "Religion",
    "Science",
    "Self-help",
    "Social Science",
    "Sports & Recreation",
    "Study Aids",
    "Technology & Engineering",
    "Transportation",
    "Travel",
    "True Crime",
    "Young Adult",
  ],
  "Performance Art Creatives": [
    "Performance Art",
    "Dance & Theatre",
    "Comedy",
  ],
  "Music, Recording & Production": ["Music & Recording", "Podcast & Audio"],
  "Television, Film & News Media": ["Film & Television", "Animation"],
  "Print, Internet, Streaming & Publishing": ["Publishing & Streaming"],
  "Visual Art Creatives": ["Visual Art", "Photography"],
};

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("✅ Connected to MongoDB");

    // Migration: the old combined "Authors and Writers" category is replaced by separate Auther/Writer categories.
    const legacy = await Category.findOne({ name: "Authors and Writers" });
    if (legacy) {
      await Subcategory.deleteMany({ category: legacy._id });
      await legacy.deleteOne();
      console.log('🗑️  Removed legacy "Authors and Writers" category and its tags');
    }

    // Migration: an earlier correctly-spelled "Author" category is merged into the real "Auther" one.
    const misspelled = await Category.findOne({ name: "Author" });
    const canonical = await Category.findOne({ name: "Auther" });
    if (misspelled && canonical) {
      await Subcategory.updateMany(
        { category: misspelled._id },
        { category: canonical._id },
      );
      await misspelled.deleteOne();
      console.log('🔀 Merged "Author" category into existing "Auther" category');
    }

    for (const [categoryName, tags] of Object.entries(CATEGORY_TAGS)) {
      // findOneAndUpdate skips the document's pre("validate") hook, so the slug is set explicitly here.
      const category = await Category.findOneAndUpdate(
        { name: categoryName },
        { name: categoryName, slug: slugify(categoryName, { lower: true, strict: true }) },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const existing = await Subcategory.find({ category: category._id }).select(
        "name",
      );
      const existingNames = new Set(existing.map((s) => s.name));
      const toCreate = tags.filter((t) => !existingNames.has(t));

      if (toCreate.length > 0) {
        await Subcategory.insertMany(
          toCreate.map((name) => ({ name, category: category._id })),
        );
      }

      console.log(
        `🏷️  ${categoryName}: ${toCreate.length} new tag(s), ${existing.length} already existed`,
      );
    }

    console.log("✅ Category & tag seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder error:", (err as Error).message);
    process.exit(1);
  }
};

seed();
