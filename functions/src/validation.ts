import { HttpsError } from "firebase-functions/v2/https";

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 120_000;

export const allowedMimeTypes = new Map<
  string,
  { extension: string; mediaType: "image" | "video" }
>([
  ["image/gif", { extension: "gif", mediaType: "image" }],
  ["image/heic", { extension: "heic", mediaType: "image" }],
  ["image/heif", { extension: "heif", mediaType: "image" }],
  ["image/jpeg", { extension: "jpg", mediaType: "image" }],
  ["image/png", { extension: "png", mediaType: "image" }],
  ["image/webp", { extension: "webp", mediaType: "image" }],
  ["video/3gpp", { extension: "3gp", mediaType: "video" }],
  ["video/mp4", { extension: "mp4", mediaType: "video" }],
  ["video/quicktime", { extension: "mov", mediaType: "video" }],
  ["video/webm", { extension: "webm", mediaType: "video" }],
  ["video/x-m4v", { extension: "m4v", mediaType: "video" }]
]);

export function requireRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Dados da publicação inválidos.");
  }
  return value as Record<string, unknown>;
}

export function requireText(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new HttpsError("invalid-argument", `Valor inválido para ${name.toLocaleLowerCase()}.`);
  }
  return normalized;
}

export function requireInteger(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number
) {
  if (
    !Number.isInteger(value) ||
    (value as number) < minimum ||
    (value as number) > maximum
  ) {
    throw new HttpsError("invalid-argument", `Valor inválido para ${name.toLocaleLowerCase()}.`);
  }
  return value as number;
}

export function normalizeStringList(
  value: unknown,
  maximumItems: number,
  maximumLength: number
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maximumLength))
    .filter(Boolean)
    .slice(0, maximumItems);
}
