import type { PublicationMediaInput, SubmissionMediaType } from "../types";

export const MAX_IMAGE_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 120_000;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/3gpp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v"
]);

export function getDefaultMediaMimeType(mediaType: SubmissionMediaType) {
  return mediaType === "image" ? "image/jpeg" : "video/mp4";
}

export function normalizeMediaMimeType(
  mediaType: SubmissionMediaType,
  mimeType?: string | null
) {
  const normalized = mimeType?.trim().toLowerCase() ?? "";
  return normalized || getDefaultMediaMimeType(mediaType);
}

export function isAllowedMediaMimeType(
  mediaType: SubmissionMediaType,
  mimeType: string
) {
  return mediaType === "image"
    ? ALLOWED_IMAGE_MIME_TYPES.has(mimeType)
    : ALLOWED_VIDEO_MIME_TYPES.has(mimeType);
}

export function getPublicationMediaValidationMessage(
  media: PublicationMediaInput,
  actualSize = media.fileSize ?? 0,
  actualMimeType = normalizeMediaMimeType(media.mediaType, media.mimeType)
) {
  if (!media.uri.trim()) {
    return "A mídia selecionada não pôde ser lida.";
  }

  if (!isAllowedMediaMimeType(media.mediaType, actualMimeType)) {
    return media.mediaType === "image"
      ? "Use uma foto JPEG, PNG, WebP, HEIC ou HEIF."
      : "Use um vídeo MP4, MOV, WebM, M4V ou 3GP.";
  }

  if (actualSize <= 0) {
    return "O arquivo selecionado está vazio.";
  }

  const maximumSize =
    media.mediaType === "image" ? MAX_IMAGE_FILE_SIZE : MAX_VIDEO_FILE_SIZE;
  if (actualSize > maximumSize) {
    return media.mediaType === "image"
      ? "A foto deve ter no máximo 15 MB."
      : "O vídeo deve ter no máximo 200 MB.";
  }

  if (
    media.mediaType === "video" &&
    media.durationMs !== undefined &&
    media.durationMs > MAX_VIDEO_DURATION_MS
  ) {
    return "O vídeo deve ter no máximo 2 minutos.";
  }

  return "";
}
