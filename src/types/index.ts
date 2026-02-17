import { Request } from "express";
import { Document, Types } from "mongoose";

/* ═══════════════════════════════════
   ENUMS & LITERAL TYPES
   ═══════════════════════════════════ */

export type BookStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export type CopyrightType =
  | "standard"
  | "cc-by"
  | "cc-by-nc"
  | "cc-by-sa"
  | "cc-by-nc-nd"
  | "public-domain";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

export type Edition =
  | "1st Edition"
  | "2nd Edition"
  | "3rd Edition"
  | "Revised Edition"
  | "Special Edition"
  | "Limited Edition"
  | "Collector's Edition";

export type Category =
  | "Fiction"
  | "Non-Fiction"
  | "Academic / Textbook"
  | "Children's Books"
  | "Young Adult"
  | "Poetry"
  | "Comics / Graphic Novels"
  | "Reference / Encyclopedia"
  | "Religious / Spiritual"
  | "Cookbook / Food"
  | "Self-Help / Personal Development"
  | "Business / Finance"
  | "Biography / Memoir"
  | "Travel"
  | "Other";

/* ═══════════════════════════════════
   BOOK DOCUMENT INTERFACE
   ═══════════════════════════════════ */

export interface IBook extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  author: string;
  coAuthors: string[];
  language: string;
  pageCount?: number;
  publicationDate?: Date;
  isbn?: string;
  edition: Edition;
  publisher?: string;

  category: Category;
  genreTags: string[];
  targetAudience?: string;
  customTags: string[];

  frontCover: string;
  backCover?: string | null;
  qrCode?: string | null;

  manuscript: string;
  manuscriptSize: number;
  samplePdf?: string | null;

  copyrightType: CopyrightType;
  copyrightYear: number;
  copyrightHolder?: string;

  price: number;
  currency: Currency;
  allowDownload: boolean;
  allowPreview: boolean;
  isExclusive: boolean;
  preOrderEnabled: boolean;

  rightsConfirmed: boolean;
  termsAccepted: boolean;
  emailOptIn: boolean;

  status: BookStatus;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  viewCount: number;
  downloadCount: number;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  isFree: boolean;
  coverUrls: { front: string; back: string | null };

  // Instance methods
  approve(): Promise<IBook>;
  reject(reason: string): Promise<IBook>;
  archive(): Promise<IBook>;
  incrementViews(): Promise<IBook>;
}

/* ═══════════════════════════════════
   BOOK DATA (create / update payload)
   ═══════════════════════════════════ */

export interface IBookCreateData {
  title?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  coAuthors?: string[];
  language?: string;
  pageCount?: number;
  publicationDate?: string | Date;
  isbn?: string;
  edition?: string;
  publisher?: string;
  category?: string;
  genreTags?: string[];
  targetAudience?: string;
  customTags?: string[];
  frontCover?: string;
  backCover?: string | null;
  qrCode?: string | null;
  manuscript?: string;
  manuscriptSize?: number;
  samplePdf?: string | null;
  copyrightType?: string;
  copyrightYear?: number;
  copyrightHolder?: string;
  price?: number;
  currency?: string;
  allowDownload?: boolean;
  allowPreview?: boolean;
  isExclusive?: boolean;
  preOrderEnabled?: boolean;
  rightsConfirmed?: boolean;
  termsAccepted?: boolean;
  emailOptIn?: boolean;
  status?: BookStatus;
}

/* ═══════════════════════════════════
   QUERY PARAMS
   ═══════════════════════════════════ */

export interface IBookListQuery {
  page?: number;
  limit?: number;
  status?: BookStatus;
  category?: string;
  search?: string;
  author?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

/* ═══════════════════════════════════
   API RESPONSES
   ═══════════════════════════════════ */

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: IPaginationMeta;
}

/* ═══════════════════════════════════
   STATS
   ═══════════════════════════════════ */

export interface IBookStats {
  statusCounts: Record<string, number>;
  topCategories: Array<{ _id: string; count: number }>;
  totals: {
    totalBooks: number;
    totalViews: number;
    totalDownloads: number;
    avgPrice: number;
  };
}

/* ═══════════════════════════════════
   MULTER FILE MAP
   ═══════════════════════════════════ */

export interface IMulterFiles {
  frontCover?: Express.Multer.File[];
  backCover?: Express.Multer.File[];
  qrCode?: Express.Multer.File[];
  manuscript?: Express.Multer.File[];
  samplePdf?: Express.Multer.File[];
  [fieldname: string]: Express.Multer.File[] | undefined;
}

export interface IBookRequest extends Request {
  files?: IMulterFiles;
}

/* ═══════════════════════════════════
   CONFIG
   ═══════════════════════════════════ */

export interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  frontendUrl: string;
  fileLimits: {
    cover: number;
    qrCode: number;
    manuscript: number;
    sample: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  allowedImageTypes: string[];
  allowedPdfTypes: string[];
  bookStatuses: Record<string, BookStatus>;
}

/* ═══════════════════════════════════
   MONGO FILTER HELPER
   ═══════════════════════════════════ */

export interface IBookFilter {
  status?: BookStatus;
  category?: string;
  author?: { $regex: string; $options: string };
  language?: string;
  price?: { $gte?: number; $lte?: number };
  $text?: { $search: string };
}
