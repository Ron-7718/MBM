import Book from "../models/Book";
import ApiError from "../utils/ApiError";
import {
  getFileUrl,
  parseArray,
  parseBool,
  deleteFile,
} from "../utils/helpers";
import type {
  IBook,
  IBookCreateData,
  IBookListQuery,
  IBookStats,
  IBookFilter,
  IMulterFiles,
} from "../types";

class BookService {
  /**
   * CREATE — submit a new book for review.
   */
  async createBook(
    body: Record<string, unknown>,
    files?: IMulterFiles,
  ): Promise<IBook> {
    if (!files?.frontCover?.[0]) {
      throw ApiError.badRequest("Front cover image is required");
    }
    if (!files?.manuscript?.[0]) {
      throw ApiError.badRequest("Manuscript PDF is required");
    }

    const bookData = this.buildBookData(body, files);
    bookData.status = "pending_review";
    bookData.manuscriptSize = files.manuscript[0].size;

    const book = new Book(bookData);
    return await book.save();
  }

  /**
   * DRAFT — save as draft (relaxed validation, files optional).
   */
  async saveDraft(
    body: Record<string, unknown>,
    files?: IMulterFiles,
  ): Promise<IBook> {
    const bookData = this.buildBookData(body, files);
    bookData.status = "draft";

    if (files?.manuscript?.[0]) {
      bookData.manuscriptSize = files.manuscript[0].size;
    }

    const book = new Book(bookData);
    await book.save({ validateBeforeSave: false });

    return book;
  }

  /**
   * LIST — paginated, filtered, searchable, sortable.
   */
  async listBooks(queryParams: IBookListQuery): Promise<{
    books: IBook[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 12,
      status,
      category,
      search,
      author,
      language,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
    } = queryParams;

    const filter: IBookFilter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (author) filter.author = { $regex: author, $options: "i" };
    if (language) filter.language = language;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"),
      Book.countDocuments(filter),
    ]);

    return { books, total, page: Number(page), limit: Number(limit) };
  }

  /**
   * GET BY ID — also increments view count.
   */
  async getBookById(id: string): Promise<IBook> {
    const book = await Book.findById(id).select("-__v");
    if (!book) throw ApiError.notFound("Book not found");

    // Fire-and-forget view increment
    Book.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).exec();

    return book;
  }

  /**
   * GET BY SLUG.
   */
  async getBookBySlug(slug: string): Promise<IBook> {
    const book = await Book.findOne({ slug }).select("-__v");
    if (!book) throw ApiError.notFound("Book not found");

    Book.updateOne({ _id: book._id }, { $inc: { viewCount: 1 } }).exec();
    return book;
  }

  /**
   * UPDATE — update fields and/or replace files.
   */
  async updateBook(
    id: string,
    body: Record<string, unknown>,
    files?: IMulterFiles,
  ): Promise<IBook> {
    const book = await Book.findById(id);
    if (!book) throw ApiError.notFound("Book not found");

    const updateData: Record<string, unknown> = {};

    // Text fields
    const textFields = [
      "title",
      "subtitle",
      "description",
      "author",
      "language",
      "pageCount",
      "publicationDate",
      "isbn",
      "edition",
      "publisher",
      "category",
      "targetAudience",
      "copyrightType",
      "copyrightYear",
      "copyrightHolder",
      "price",
      "currency",
    ];
    for (const field of textFields) {
      if (body[field] !== undefined && body[field] !== "") {
        updateData[field] = body[field];
      }
    }

    // Boolean fields
    const boolFields = [
      "allowDownload",
      "allowPreview",
      "isExclusive",
      "preOrderEnabled",
      "rightsConfirmed",
      "termsAccepted",
      "emailOptIn",
    ];
    for (const field of boolFields) {
      if (body[field] !== undefined) {
        updateData[field] = parseBool(body[field]);
      }
    }

    // Array fields
    if (body.genreTags) updateData.genreTags = parseArray(body.genreTags);
    if (body.customTags) updateData.customTags = parseArray(body.customTags);
    if (body.coAuthors) updateData.coAuthors = parseArray(body.coAuthors);

    // File replacements — delete old, use new paths
    const fileFieldMap: Record<string, keyof IBook> = {
      frontCover: "frontCover",
      backCover: "backCover",
      qrCode: "qrCode",
      manuscript: "manuscript",
      samplePdf: "samplePdf",
    };

    for (const [multerField, dbField] of Object.entries(fileFieldMap)) {
      const newFile = files?.[multerField]?.[0];
      if (newFile) {
        const oldPath = book[dbField] as string | null | undefined;
        if (oldPath) deleteFile(oldPath);
        updateData[dbField as string] = getFileUrl(newFile);

        if (multerField === "manuscript") {
          updateData.manuscriptSize = newFile.size;
        }
      }
    }

    // Numeric coercions
    if (updateData.pageCount)
      updateData.pageCount = Number(updateData.pageCount);
    if (updateData.price !== undefined)
      updateData.price = Number(updateData.price);
    if (updateData.copyrightYear)
      updateData.copyrightYear = Number(updateData.copyrightYear);

    const updated = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return updated!;
  }

  /**
   * UPDATE STATUS — approve / reject / archive.
   */
  async updateStatus(
    id: string,
    status: string,
    rejectionReason?: string,
  ): Promise<IBook> {
    const book = await Book.findById(id);
    if (!book) throw ApiError.notFound("Book not found");

    book.status = status as IBook["status"];

    if (status === "approved") {
      book.approvedAt = new Date();
      book.rejectionReason = null;
    }

    if (status === "rejected") {
      if (!rejectionReason) {
        throw ApiError.badRequest("Rejection reason is required");
      }
      book.rejectionReason = rejectionReason;
      book.approvedAt = null;
    }

    return await book.save();
  }

  /**
   * DELETE — remove book + associated files from disk.
   */
  async deleteBook(id: string): Promise<{ id: string; title: string }> {
    const book = await Book.findById(id);
    if (!book) throw ApiError.notFound("Book not found");

    const fileFields: (keyof IBook)[] = [
      "frontCover",
      "backCover",
      "qrCode",
      "manuscript",
      "samplePdf",
    ];
    for (const field of fileFields) {
      const filePath = book[field] as string | null | undefined;
      if (filePath) deleteFile(filePath);
    }

    await Book.findByIdAndDelete(id);
    return { id, title: book.title };
  }

  /**
   * STATS — aggregate dashboard statistics.
   */
  async getStats(): Promise<IBookStats> {
    const [statusCounts, categoryBreakdown, totals] = await Promise.all([
      Book.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Book.aggregate([
        { $match: { status: { $ne: "draft" } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            totalViews: { $sum: "$viewCount" },
            totalDownloads: { $sum: "$downloadCount" },
            avgPrice: { $avg: "$price" },
          },
        },
      ]),
    ]);

    return {
      statusCounts: statusCounts.reduce(
        (acc: Record<string, number>, s: { _id: string; count: number }) => {
          acc[s._id] = s.count;
          return acc;
        },
        {},
      ),
      topCategories: categoryBreakdown,
      totals: totals[0] ?? {
        totalBooks: 0,
        totalViews: 0,
        totalDownloads: 0,
        avgPrice: 0,
      },
    };
  }

  /* ═══════════════════════════════════
     PRIVATE — build book data from request
     ═══════════════════════════════════ */
  private buildBookData(
    body: Record<string, unknown>,
    files?: IMulterFiles,
  ): IBookCreateData {
    const data: IBookCreateData = {
      title: body.title as string,
      subtitle: body.subtitle as string | undefined,
      description: body.description as string,
      author: body.author as string,
      coAuthors: parseArray(body.coAuthors),
      language: (body.language as string) ?? "en",
      pageCount: body.pageCount ? Number(body.pageCount) : undefined,
      publicationDate: (body.publicationDate as string) ?? undefined,
      isbn: body.isbn as string | undefined,
      edition: (body.edition as string) ?? "1st Edition",
      publisher: body.publisher as string | undefined,
      category: body.category as string,
      genreTags: parseArray(body.genreTags),
      targetAudience: body.targetAudience as string | undefined,
      customTags: parseArray(body.customTags),
      copyrightType: (body.copyrightType as string) ?? "standard",
      copyrightYear: body.copyrightYear
        ? Number(body.copyrightYear)
        : new Date().getFullYear(),
      copyrightHolder: body.copyrightHolder as string | undefined,
      price:
        body.price !== undefined && body.price !== "" ? Number(body.price) : 0,
      currency: (body.currency as string) ?? "INR",
      allowDownload: parseBool(body.allowDownload),
      allowPreview: parseBool(body.allowPreview),
      isExclusive: parseBool(body.isExclusive),
      preOrderEnabled: parseBool(body.preOrderEnabled),
      rightsConfirmed: parseBool(body.rightsConfirmed),
      termsAccepted: parseBool(body.termsAccepted),
      emailOptIn: parseBool(body.emailOptIn),
    };

    // Attach file paths
    if (files?.frontCover?.[0])
      data.frontCover = getFileUrl(files.frontCover[0])!;
    if (files?.backCover?.[0]) data.backCover = getFileUrl(files.backCover[0]);
    if (files?.qrCode?.[0]) data.qrCode = getFileUrl(files.qrCode[0]);
    if (files?.manuscript?.[0])
      data.manuscript = getFileUrl(files.manuscript[0])!;
    if (files?.samplePdf?.[0]) data.samplePdf = getFileUrl(files.samplePdf[0]);

    // Strip undefined keys
    (Object.keys(data) as (keyof IBookCreateData)[]).forEach((key) => {
      if (data[key] === undefined) delete data[key];
    });

    return data;
  }
}

export default new BookService();
