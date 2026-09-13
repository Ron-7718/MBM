import CreativeVideo from "../models/CreativeVideo";
import ApiError from "../utils/ApiError";
import { getFileUrl, deleteFile } from "../utils/helpers";
import type { CreativeVideoSection, ICreativeVideo } from "../types";

const VALID_SECTIONS: CreativeVideoSection[] = ["pitch_alley", "ask_universe"];

class CreativeVideoService {
  /**
   * UPLOAD — a creative posts their pitch / ask-the-universe video (max 500MB,
   * enforced by the upload middleware before this ever runs). Each creative may
   * only have one video per section — uploading again replaces the old one.
   */
  async uploadVideo(
    body: Record<string, unknown>,
    file: Express.Multer.File | undefined,
    userId: string,
  ): Promise<ICreativeVideo> {
    if (!file) throw ApiError.badRequest("Video file is required");

    const section = body.section as CreativeVideoSection;
    if (!VALID_SECTIONS.includes(section)) {
      deleteFile(getFileUrl(file));
      throw ApiError.badRequest(
        "Invalid section — must be pitch_alley or ask_universe",
      );
    }

    const existing = await CreativeVideo.findOne({ userId, section });

    if (existing) {
      deleteFile(existing.videoUrl);
      existing.title = body.title as string;
      existing.description = (body.description as string) || undefined;
      existing.videoUrl = getFileUrl(file) as string;
      existing.videoSize = file.size;
      existing.views = 0;
      return await existing.save();
    }

    const video = new CreativeVideo({
      userId,
      section,
      title: body.title,
      description: body.description || undefined,
      videoUrl: getFileUrl(file),
      videoSize: file.size,
    });

    return await video.save();
  }

  /**
   * LIST — the logged-in creative's own videos, optionally filtered by section.
   */
  async listMyVideos(
    userId: string,
    section?: CreativeVideoSection,
  ): Promise<ICreativeVideo[]> {
    const filter: Record<string, unknown> = { userId };
    if (section) filter.section = section;

    return CreativeVideo.find(filter).sort({ createdAt: -1 }).select("-__v");
  }

  /**
   * LIST PUBLIC — a creative's videos for a given section, shown on their
   * public profile when a visitor views it.
   */
  async listPublicByUser(
    userId: string,
    section: CreativeVideoSection,
  ): Promise<ICreativeVideo[]> {
    return CreativeVideo.find({ userId, section })
      .sort({ createdAt: -1 })
      .select("-__v -userId")
      .lean();
  }

  /**
   * UPDATE — edit title/description of an owned video.
   */
  async updateVideo(
    id: string,
    body: Record<string, unknown>,
    requesterId: string,
  ): Promise<ICreativeVideo> {
    const video = await CreativeVideo.findById(id);
    if (!video) throw ApiError.notFound("Video not found");

    if (video.userId !== requesterId) {
      throw ApiError.forbidden("You do not have permission to edit this video");
    }

    if (body.title !== undefined && body.title !== "") {
      video.title = body.title as string;
    }
    if (body.description !== undefined) {
      video.description = body.description as string;
    }

    return await video.save();
  }

  /**
   * DELETE — removes the DB record and the underlying file on disk.
   */
  async deleteVideo(id: string, requesterId: string): Promise<void> {
    const video = await CreativeVideo.findById(id);
    if (!video) throw ApiError.notFound("Video not found");

    if (video.userId !== requesterId) {
      throw ApiError.forbidden(
        "You do not have permission to delete this video",
      );
    }

    deleteFile(video.videoUrl);
    await video.deleteOne();
  }

  /**
   * VIEW — records that a visitor watched this video (public, no ownership check).
   */
  async incrementViews(id: string): Promise<{ views: number }> {
    const video = await CreativeVideo.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    ).select("views");

    if (!video) throw ApiError.notFound("Video not found");

    return { views: video.views };
  }
}

export default new CreativeVideoService();
