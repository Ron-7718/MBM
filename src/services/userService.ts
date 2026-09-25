import { UserStepModel } from "../models/authModel";
import Book from "../models/Book";
import CreativeVideo from "../models/CreativeVideo";
import Comment from "../models/Comment";
import ApiError from "../utils/ApiError";
import type {
  IUserListQuery,
  IPublicUser,
} from "../types";

// Only these fields are exposed publicly
const PUBLIC_FIELDS = "name role gender createdAt";

/**
 * Aggregates a creator's public stats (works/views/likes/comments) across
 * their approved books only — drafts/pending/rejected books stay invisible.
 */
async function getCreatorStats(userId: string): Promise<{
  bookCount: number;
  views: number;
  likes: number;
  comments: number;
}> {
  const approvedBooks = await Book.find({ userId, status: "approved" })
    .select("_id viewCount likedBy")
    .lean();

  const bookCount = approvedBooks.length;
  const views = approvedBooks.reduce((sum, b) => sum + (b.viewCount || 0), 0);
  const likes = approvedBooks.reduce(
    (sum, b) => sum + (b.likedBy?.length || 0),
    0,
  );

  const bookIds = approvedBooks.map((b) => b._id.toString());
  const comments = bookIds.length
    ? await Comment.countDocuments({ bookId: { $in: bookIds } })
    : 0;

  return { bookCount, views, likes, comments };
}

/**
 * LIST — public directory of creators
 * Authors/writers only, readers excluded.
 */
export const listAuthors = async (
  queryParams: IUserListQuery,
): Promise<{
  users: IPublicUser[];
  total: number;
  page: number;
  limit: number;
}> => {
  const {
    page = 1,
    limit = 12,
    search,
    role,
  } = queryParams;

  const filter: Record<string, unknown> = {
    step: 4,
    role: role
      ? role
      : {
          $in: ["author", "writer"],
        },
  };

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const [records, total] = await Promise.all([
    UserStepModel.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    UserStepModel.countDocuments(filter),
  ]);

  const users: IPublicUser[] = await Promise.all(
    records.map(async (record) => {
      const stats = await getCreatorStats(record._id.toString());

      return {
        _id: record._id.toString(),
        name: record.name,
        role: record.role,
        gender: record.gender,
        createdAt: record.createdAt,
        bookCount: stats.bookCount,
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
      };
    }),
  );

  return {
    users,
    total,
    page: pageNumber,
    limit: limitNumber,
  };
};

/**
 * GET BY ID — public author/writer profile
 * Includes their published works.
 */
export const getPublicProfileById = async (
  id: string,
): Promise<{
  user: IPublicUser;
  books: unknown[];
  bookCount: number;
  pitchVideos: unknown[];
  universeVideos: unknown[];
}> => {
  const record = await UserStepModel.findOne({
    _id: id,
    step: 4,
    role: {
      $in: ["author", "writer"],
    },
  })
    .select(PUBLIC_FIELDS)
    .lean();

  if (!record) {
    throw ApiError.notFound("Author profile not found");
  }

  const bookFilter = {
    userId: record._id.toString(),
    status: "approved",
  };

  const [books, stats, pitchVideos, universeVideos] = await Promise.all([
    Book.find(bookFilter)
      .select(
        "title slug frontCover category price createdAt viewCount",
      )
      .sort({ createdAt: -1 })
      .limit(24)
      .lean(),

    getCreatorStats(record._id.toString()),

    // Videos this creative has posted to Pitch Alley / Ask the Universe —
    // shown on their public profile whenever a visitor views it.
    CreativeVideo.find({ userId: id, section: "pitch_alley" })
      .select("-__v -userId")
      .sort({ createdAt: -1 })
      .lean(),

    CreativeVideo.find({ userId: id, section: "ask_universe" })
      .select("-__v -userId")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    user: {
      _id: record._id.toString(),
      name: record.name,
      role: record.role,
      gender: record.gender,
      createdAt: record.createdAt,
      bookCount: stats.bookCount,
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
    },
    books,
    bookCount: stats.bookCount,
    pitchVideos,
    universeVideos,
  };
};