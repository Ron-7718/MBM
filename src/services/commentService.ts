import Comment from "../models/Comment";
import Book from "../models/Book";
import ApiError from "../utils/ApiError";
import type { IComment } from "../types";

class CommentService {
  /**
   * ADD — post a comment on a book.
   */
  async addComment(
    bookId: string,
    userId: string,
    userName: string | undefined,
    text: string,
  ): Promise<IComment> {
    const book = await Book.findById(bookId).select("_id");
    if (!book) throw ApiError.notFound("Book not found");

    const comment = new Comment({ bookId, userId, userName, text });
    return await comment.save();
  }

  /**
   * LIST — paginated comments for a book, newest first.
   */
  async listComments(
    bookId: string,
    page = 1,
    limit = 20,
  ): Promise<{ comments: IComment[]; total: number; page: number; limit: number }> {
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ bookId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v")
        .lean(),
      Comment.countDocuments({ bookId }),
    ]);

    return { comments, total, page: Number(page), limit: Number(limit) };
  }
}

export default new CommentService();
