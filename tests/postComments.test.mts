import assert from "node:assert/strict";
import test from "node:test";
import type { PostComment } from "../src/types.ts";
import {
  formatPostCommentAge,
  groupPostCommentsByPlayer,
  normalizePostCommentBody,
  normalizePostComments,
  removeOwnedPostComment
} from "../src/utils/postComments.ts";

const comment: PostComment = {
  authorName: "Pedro Barberini",
  authorProfileId: "profile-user-a",
  authorUserId: "user-a",
  authorUsername: "pedro",
  body: "Belo lance!",
  createdAt: "2026-08-01T12:00:00.000Z",
  id: "comment-a",
  playerId: "player-a"
};

test("normaliza comentarios validos e descarta entradas corrompidas", () => {
  assert.deepEqual(normalizePostComments([comment, null, { body: "sem autor" }]), [
    comment
  ]);
});

test("agrupa comentarios pela publicacao", () => {
  assert.deepEqual(
    groupPostCommentsByPlayer([
      comment,
      { ...comment, id: "comment-b", playerId: "player-b" }
    ]),
    {
      "player-a": [comment],
      "player-b": [{ ...comment, id: "comment-b", playerId: "player-b" }]
    }
  );
});

test("somente o autor consegue remover o proprio comentario", () => {
  assert.deepEqual(removeOwnedPostComment([comment], comment.id, "user-b"), [comment]);
  assert.deepEqual(removeOwnedPostComment([comment], comment.id, "user-a"), []);
});

test("limita o corpo e formata o tempo relativo", () => {
  assert.equal(normalizePostCommentBody(`  ${"a".repeat(510)}  `).length, 500);
  assert.equal(
    formatPostCommentAge(comment.createdAt, Date.parse("2026-08-01T12:02:00.000Z")),
    "2 min"
  );
});