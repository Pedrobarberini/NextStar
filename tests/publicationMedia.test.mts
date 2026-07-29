import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  getPublicationMediaValidationMessage,
  isAllowedMediaMimeType
} from "../src/utils/publicationMedia.ts";

const photo = {
  fileName: "foto.jpg",
  fileSize: 1024,
  mediaType: "image" as const,
  mimeType: "image/jpeg",
  uri: "file:///foto.jpg"
};
const video = {
  durationMs: 30_000,
  fileName: "video.mp4",
  fileSize: 2048,
  mediaType: "video" as const,
  mimeType: "video/mp4",
  uri: "file:///video.mp4"
};

test("aceita somente formatos previstos para foto e vídeo", () => {
  assert.equal(isAllowedMediaMimeType("image", "image/jpeg"), true);
  assert.equal(isAllowedMediaMimeType("video", "video/mp4"), true);
  assert.equal(isAllowedMediaMimeType("image", "image/svg+xml"), false);
  assert.equal(isAllowedMediaMimeType("video", "application/octet-stream"), false);
});

test("aplica limites diferentes para foto e vídeo", () => {
  assert.equal(getPublicationMediaValidationMessage(photo), "");
  assert.equal(getPublicationMediaValidationMessage(video), "");
  assert.equal(
    getPublicationMediaValidationMessage(
      { ...photo, fileSize: MAX_IMAGE_FILE_SIZE + 1 }
    ),
    "A foto deve ter no máximo 15 MB."
  );
  assert.equal(
    getPublicationMediaValidationMessage(
      { ...video, fileSize: MAX_VIDEO_FILE_SIZE + 1 }
    ),
    "O vídeo deve ter no máximo 200 MB."
  );
});

test("rejeita vídeo acima de dois minutos", () => {
  assert.equal(
    getPublicationMediaValidationMessage({ ...video, durationMs: 120_001 }),
    "O vídeo deve ter no máximo 2 minutos."
  );
});
