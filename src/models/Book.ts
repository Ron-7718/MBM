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
      enum: {
        values: [
          "1st Edition",
          "2nd Edition",
          "3rd Edition",
          "Revised Edition",
          "Special Edition",
          "Limited Edition",
          "Collector's Edition",
        ],
        message: "Invalid edition type",
      },
    },
    publisher: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    /* ═══════════════════════════════════
       SECTION 02 — CATEGORY & GENRE
       ═══════════════════════════════════ */
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Fiction",
          "Non-Fiction",
          "Academic / Textbook",
          "Children's Books",
          "Young Adult",
          "Poetry",
          "Comics / Graphic Novels",
          "Reference / Encyclopedia",
          "Religious / Spiritual",
          "Cookbook / Food",
          "Self-Help / Personal Development",
          "Business / Finance",
          "Biography / Memoir",
          "Travel",
          "Other",
        ],
        message: "Invalid category",
      },
    },
    genreTags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: "Maximum 5 genre tags allowed",
      },
    },
    targetAudience: {
      type: String,
      enum: {
        values: [
          "",
          "General Audience",
          "Children (0–12)",
          "Teenagers (13–17)",
          "Young Adults (18–25)",
          "Adults (25+)",
          "Academic / Professional",
        ],
        message: "Invalid audience type",
      },
    },
    customTags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 15,
        message: "Maximum 15 custom tags allowed",
      },
    },

    /* ═══════════════════════════════════
       SECTION 03 — COVER ART & MEDIA
       ═══════════════════════════════════ */
    frontCover: {
      type: String,
      // required: [true, "Front cover image is required"],
    },
    backCover: { type: String, default: null },
    qrCode: { type: String, default: null },

    /* ═══════════════════════════════════
       SECTION 04 — MANUSCRIPT
       ═══════════════════════════════════ */
    manuscript: {
      type: String,
      required: [true, "Manuscript PDF is required"],
    },
    manuscriptSize: { type: Number, default: 0 },
    samplePdf: { type: String, default: null },

    /* ═══════════════════════════════════
       SECTION 05 — COPYRIGHT & LICENSING
       ═══════════════════════════════════ */
    copyrightType: {
      type: String,
      enum: {
        values: [
          "standard",
          "cc-by",
          "cc-by-nc",
          "cc-by-sa",
          "cc-by-nc-nd",
          "public-domain",
        ],
        message: "Invalid copyright type",
      },
      default: "standard",
    },
    copyrightYear: {
      type: Number,
      default: () => new Date().getFullYear(),
      min: [1900, "Copyright year must be after 1900"],
      max: [2100, "Copyright year must be before 2100"],
    },
    copyrightHolder: { type: String, trim: true, maxlength: 200 },

    /* ═══════════════════════════════════
       SECTION 06 — PRICING & DISTRIBUTION
       ═══════════════════════════════════ */
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
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
       SECTION 07 — AGREEMENTS
       ═══════════════════════════════════ */
    rightsConfirmed: {
      type: Boolean,
      required: [true, "Publishing rights must be confirmed"],
    },
    termsAccepted: {
      type: Boolean,
      required: [true, "Terms must be accepted"],
    },
    emailOptIn: { type: Boolean, default: false },

    /* ═══════════════════════════════════
       STATUS & META
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

/* ── Indexes ── */
bookSchema.index({ title: "text", description: "text", author: "text" });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ createdAt: -1 });

/* ── Pre-save: auto-generate unique slug ── */
bookSchema.pre<IBook>("save", async function (next) {
  if (this.isModified("title") || this.isNew) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (
      await mongoose.models.Book?.findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }

  if (!this.copyrightHolder && this.author) {
    this.copyrightHolder = this.author;
  }

  next();
});

/* ── Virtuals ── */
bookSchema.virtual("isFree").get(function (this: IBook) {
  return this.price === 0;
});

bookSchema.virtual("coverUrls").get(function (this: IBook) {
  return { front: this.frontCover, back: this.backCover ?? null };
});

/* ── Instance Methods ── */
bookSchema.methods.approve = async function (this: IBook): Promise<IBook> {
  this.status = "approved";
  this.approvedAt = new Date();
  return this.save();
};

bookSchema.methods.reject = async function (
  this: IBook,
  reason: string,
): Promise<IBook> {
  this.status = "rejected";
  this.rejectionReason = reason;
  return this.save();
};

bookSchema.methods.archive = async function (this: IBook): Promise<IBook> {
  this.status = "archived";
  return this.save();
};

bookSchema.methods.incrementViews = async function (
  this: IBook,
): Promise<IBook> {
  this.viewCount += 1;
  return this.save();
};

const Book: Model<IBook> = mongoose.model<IBook>("Book", bookSchema);

export default Book;
