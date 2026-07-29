import assert from "node:assert/strict";
import test from "node:test";
import {
  firebasePostToSubmission,
  normalizeFirebasePostDocument
} from "../src/utils/firebasePostDocument.ts";

const postId = "post-123";
const createdAt = new Date("2026-07-29T12:00:00.000Z");
const validDocument = {
  authorId: "user-1",
  createdAt: { toDate: () => createdAt },
  description: "Descrição pública do conteúdo.",
  durationMs: 25_000,
  fileName: "lance.mp4",
  fileSize: 2_000_000,
  height: 1920,
  mediaPath: `posts/user-1/${postId}/media`,
  mediaType: "video",
  mentions: ["perfil.marcado"],
  mimeType: "video/mp4",
  status: "published",
  tags: ["futebol", "treino"],
  title: "Meu melhor lance",
  updatedAt: createdAt,
  width: 1080
};

test("normaliza um documento remoto válido", () => {
  const post = normalizeFirebasePostDocument(postId, validDocument);

  assert.ok(post);
  assert.equal(post.authorId, "user-1");
  assert.equal(post.createdAt, createdAt.toISOString());
  assert.equal(post.mediaPath, `posts/user-1/${postId}/media`);
});

test("rejeita caminho, formato e tamanho inconsistentes", () => {
  assert.equal(
    normalizeFirebasePostDocument(postId, {
      ...validDocument,
      mediaPath: "posts/outro/post-123/media"
    }),
    null
  );
  assert.equal(
    normalizeFirebasePostDocument(postId, {
      ...validDocument,
      mimeType: "application/octet-stream"
    }),
    null
  );
  assert.equal(
    normalizeFirebasePostDocument(postId, {
      ...validDocument,
      fileSize: 300 * 1024 * 1024
    }),
    null
  );
  assert.equal(
    normalizeFirebasePostDocument(postId, {
      ...validDocument,
      mediaType: "audio"
    }),
    null
  );
  assert.equal(
    normalizeFirebasePostDocument(postId, {
      ...validDocument,
      durationMs: 1,
      mediaType: "image",
      mimeType: "image/jpeg"
    }),
    null
  );
});

test("converte o documento para o modelo atual do feed", () => {
  const post = normalizeFirebasePostDocument(postId, validDocument);
  assert.ok(post);

  const submission = firebasePostToSubmission(
    postId,
    post,
    "https://storage.test/media"
  );
  assert.equal(submission.status, "Aprovado");
  assert.equal(submission.userId, "user-1");
  assert.equal(submission.videoLink, "https://storage.test/media");
  assert.equal(submission.storagePath, validDocument.mediaPath);
});
