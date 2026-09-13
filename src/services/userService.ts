import { UserStepModel } from "../models/authModel";
import Book from "../models/Book";
import CreativeVideo from "../models/CreativeVideo";
import ApiError from "../utils/ApiError";
import type {
  IUserListQuery,
  IPublicUser,
} from "../types";

// Only these fields are exposed publicly
const PUBLIC_FIELDS = "name role gender createdAt";

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
      const bookCount = await Book.countDocuments({
        author: record.name,
        status: "approved",
      });

      return {
        _id: record._id.toString(),
        name: record.name,
        role: record.role,
        gender: record.gender,
        createdAt: record.createdAt,
        bookCount,
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
    author: record.name,
    status: "approved",
  };

  const [books, bookCount, pitchVideos, universeVideos] = await Promise.all([
    Book.find(bookFilter)
      .select(
        "title slug frontCover category price createdAt viewCount",
      )
      .sort({ createdAt: -1 })
      .limit(24)
      .lean(),

    Book.countDocuments(bookFilter),

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
      bookCount,
    },
    books,
    bookCount,
    pitchVideos,
    universeVideos,
  };
};