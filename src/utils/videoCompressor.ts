import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { v4 as uuidv4 } from "uuid";
import ApiError from "./ApiError";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const AUDIO_BITRATE_KBPS = 128;
const MIN_VIDEO_BITRATE_KBPS = 150;
const SAFETY_MARGIN = 0.92; // leave headroom for container/muxing overhead

export const COMPRESSED_VIDEO_MAX_BYTES = 25 * 1024 * 1024; // 25MB

const getDurationSeconds = (filePath: string): Promise<number> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });

/**
 * Re-encodes a video to fit within `maxBytes` by targeting a bitrate derived
 * from its duration, mutating `file` in place to point at the new output.
 * If the file already fits, it's left untouched.
 */
export const compressVideoIfNeeded = async (
  file: Express.Multer.File,
  maxBytes: number,
): Promise<Express.Multer.File> => {
  if (file.size <= maxBytes) return file;

  const duration = await getDurationSeconds(file.path).catch(() => 0);
  if (!duration || duration <= 0) {
    throw ApiError.badRequest("Could not read video duration for compression");
  }

  const targetTotalBitsPerSec =
    (maxBytes * 8 * SAFETY_MARGIN) / duration;
  const videoBitrateKbps = Math.max(
    MIN_VIDEO_BITRATE_KBPS,
    Math.floor(targetTotalBitsPerSec / 1000) - AUDIO_BITRATE_KBPS,
  );

  const outputDir = path.dirname(file.path);
  const outputFilename = `${uuidv4()}.mp4`;
  const outputPath = path.join(outputDir, outputFilename);
  const originalPath = file.path;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(originalPath)
      .videoBitrate(videoBitrateKbps)
      .audioBitrate(AUDIO_BITRATE_KBPS)
      .outputOptions(["-preset veryfast", "-movflags +faststart"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  }).catch((err) => {
    fs.unlink(outputPath, () => {});
    throw ApiError.internal(`Video compression failed: ${err.message}`);
  });

  fs.unlink(originalPath, () => {});

  file.path = outputPath;
  file.filename = outputFilename;
  file.size = fs.statSync(outputPath).size;
  file.mimetype = "video/mp4";

  return file;
};
