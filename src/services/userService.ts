import { UserStepModel } from "../models/authModel";
import Book from "../models/Book";
import CreativeVideo from "../models/CreativeVideo";
import Comment from "../models/Comment";
import ApiError from "../utils/ApiError";
import { deleteFile } from "../utils/helpers";
import type {
  IUserListQuery,
  IPublicUser,
  IUserSocialLink,
} from "../types";

const toPublicSocialLinks = (
  links?: Array<{ platform: string; url: string }>,
): IUserSocialLink[] | undefined =>
  links?.map((link) => ({
    platform: link.platform as IUserSocialLink["platform"],
    url: link.url,
  }));

// Only these fields are exposed publicly
const PUBLIC_FIELDS = "name role gender createdAt bio avatarUrl craft location socialLinks";

export interface IUpdateProfileInput {
  name: string;
  dob: string;
  gender: string;
  bio?: string;
  avatarUrl?: string;
  craft?: string;
  location?: string;
  socialLinks: IUserSocialLink[];
}

const MY_PROFILE_FIELDS = "identifier name dob gender role step bio avatarUrl craft location socialLinks createdAt updatedAt";

export const getMyProfileById = async (id: string) => {
  const user = await UserStepModel.findById(id).select(MY_PROFILE_FIELDS).lean();
  if (!user) throw ApiError.notFound("Profile not found");
  return user;
};

export const updateMyProfileById = async (id: string, input: IUpdateProfileInput) => {
  const user = await UserStepModel.findById(id).select(MY_PROFILE_FIELDS);
  if (!user) throw ApiError.notFound("Profile not found");

  user.name = input.name.trim();
  user.dob = input.dob;
  user.gender = input.gender;
  user.bio = input.bio?.trim() ?? "";
  const previousAvatarUrl = user.avatarUrl;
  user.avatarUrl = input.avatarUrl?.trim() ?? "";
  user.craft = input.craft?.trim() ?? "";
  user.location = input.location?.trim() ?? "";
  user.socialLinks = input.socialLinks.map((link) => ({
    platform: link.platform,
    url: link.url.trim(),
  }));
  await user.save();

  if (previousAvatarUrl && previousAvatarUrl !== user.avatarUrl && previousAvatarUrl.startsWith("/uploads/profile-photos/")) {
    deleteFile(previousAvatarUrl);
  }

  return user.toObject();
};

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
        bio: record.bio,
        avatarUrl: record.avatarUrl,
        craft: record.craft,
        location: record.location,
        socialLinks: toPublicSocialLinks(record.socialLinks),
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
      bio: record.bio,
      avatarUrl: record.avatarUrl,
      craft: record.craft,
      location: record.location,
      socialLinks: toPublicSocialLinks(record.socialLinks),
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
