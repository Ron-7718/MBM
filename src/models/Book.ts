import mongoose, { Schema, Model } from "mongoose";
import slugify from "slugify";
import type { IBook } from "../types";

const bookSchema = new Schema<IBook>(
  {
    /* ═══════════════════════════════════
       SECTION 01 — BOOK DETAILS
       ═══════════════════════════════════ */
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, "Subtitle cannot exceed 300 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: 200,
    },
    coAuthors: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 co-authors allowed",
      },
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      default: "en",
    },
    pageCount: {
      type: Number,
      min: [1, "Page count must be at least 1"],
    },
    publicationDate: {
      type: Date,
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    edition: {
      type: String,
      default: "1st Edition",
      enum: [
        "1st Edition",
        "2nd Edition",
        "3rd Edition",
        "Revised Edition",
        "Special Edition",
        "Limited Edition",
        "Collector's Edition",
      ],
    },
    publisher: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    /* ═══════════════════════════════════
       CATEGORY & GENRE
       ═══════════════════════════════════ */
    category: {
      type: String,
     
    },
    genreTags: {
      type: [String],
      default: [],
    },
    targetAudience: {
      type: String,
      default: "",
    },
    customTags: {
      type: [String],
      default: [],
    },

    /* ═══════════════════════════════════
       MEDIA
       ═══════════════════════════════════ */
    frontCover: { type: String },
    backCover: { type: String, default: null },
    qrCode: { type: String, default: null },

    /* ═══════════════════════════════════
       MANUSCRIPT
       ═══════════════════════════════════ */
    manuscript: {
      type: String,
      required: true,
    },
    manuscriptSize: { type: Number, default: 0 },
    samplePdf: { type: String, default: null },

    /* ═══════════════════════════════════
       COPYRIGHT
       ═══════════════════════════════════ */
    copyrightType: {
      type: String,
      enum: [
        "standard",
        "cc-by",
        "cc-by-nc",
        "cc-by-sa",
        "cc-by-nc-nd",
        "public-domain",
      ],
      default: "standard",
    },
    copyrightYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    copyrightHolder: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    /* ═══════════════════════════════════
       PRICING
       ═══════════════════════════════════ */
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },

    allowDownload: { type: Boolean, default: true },
    allowPreview: { type: Boolean, default: true },
    isExclusive: { type: Boolean, default: false },
    preOrderEnabled: { type: Boolean, default: false },

    /* ═══════════════════════════════════
       AGREEMENTS
       ═══════════════════════════════════ */
    rightsConfirmed: {
      type: Boolean,
      required: true,
    },
    termsAccepted: {
      type: Boolean,
      required: true,
    },
    emailOptIn: { type: Boolean, default: false },

    /* ═══════════════════════════════════
       STATUS
       ═══════════════════════════════════ */
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected", "archived"],
      default: "pending_review",
      index: true,
    },
    rejectionReason: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ═══════════════════════════════════
   INDEXES (FIXED MULTILINGUAL)
═══════════════════════════════════ */

bookSchema.index(
  { title: "text", description: "text", author: "text" },
  { default_language: "none" }, // 🔥 Fix for Arabic error
);

bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ createdAt: -1 });

/* ═══════════════════════════════════
   PRE-SAVE SLUG
═══════════════════════════════════ */

bookSchema.pre<IBook>("save", async function (next) {
  if (this.isModified("title") || this.isNew) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (
      await mongoose.models.Book?.findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
  }

  if (!this.copyrightHolder && this.author) {
    this.copyrightHolder = this.author;
  }

  next();
});

/* ═══════════════════════════════════
   VIRTUALS
═══════════════════════════════════ */

bookSchema.virtual("isFree").get(function (this: IBook) {
  return this.price === 0;
});

/* ═══════════════════════════════════
   MODEL EXPORT
═══════════════════════════════════ */

const Book: Model<IBook> = mongoose.model<IBook>("Book", bookSchema);

export default Book;
