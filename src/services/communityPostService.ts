import CommunityPost from "../models/CommunityPost";
import { UserStepModel } from "../models/authModel";
import ApiError from "../utils/ApiError";
import { deleteFile, getFileUrl } from "../utils/helpers";
import type { ICommunityPost } from "../types";

class CommunityPostService {
  async create(body: Record<string, unknown>, file: Express.Multer.File | undefined, userId: string): Promise<ICommunityPost> {
    if (!file) throw ApiError.badRequest("Post image is required");
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    if (!title || !description) {
      deleteFile(getFileUrl(file));
      throw ApiError.badRequest("Title and description are required");
    }
    if (title.length > 150 || description.length > 2000) {
      deleteFile(getFileUrl(file));
      throw ApiError.badRequest("Title must be under 150 characters and description under 2000");
    }
    const user = await UserStepModel.findById(userId).select("name");
    if (!user) {
      deleteFile(getFileUrl(file));
      throw ApiError.notFound("User not found");
    }
    return CommunityPost.create({ userId, userName: user.name || "MeBookMeta creator", title, description, imageUrl: getFileUrl(file) });
  }

  async list(options: { userId?: string; viewerId?: string; limit?: number } = {}) {
    const filter = options.userId ? { userId: options.userId } : {};
    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 })
      .limit(Math.min(Math.max(options.limit ?? 30, 1), 100)).select("-__v -likedBy").lean();
    const likes = await CommunityPost.find({ _id: { $in: posts.map((post) => post._id) } }).select("likedBy").lean();
    const likedByPost = new Map(likes.map((post) => [String(post._id), post.likedBy]));
    return posts.map((post) => {
      const likedBy = likedByPost.get(String(post._id)) ?? [];
      return { ...post, likeCount: likedBy.length, liked: Boolean(options.viewerId && likedBy.includes(options.viewerId)) };
    });
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await CommunityPost.findById(id).select("likedBy");
    if (!post) throw ApiError.notFound("Post not found");
    const liked = post.likedBy.includes(userId);
    const updated = await CommunityPost.findByIdAndUpdate(id,
      liked ? { $pull: { likedBy: userId } } : { $addToSet: { likedBy: userId } },
      { new: true }).select("likedBy");
    return { liked: !liked, likeCount: updated?.likedBy.length ?? 0 };
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await CommunityPost.findById(id);
    if (!post) throw ApiError.notFound("Post not found");
    if (post.userId !== userId) throw ApiError.forbidden("You cannot delete this post");
    deleteFile(post.imageUrl);
    await post.deleteOne();
  }
}

export default new CommunityPostService();
