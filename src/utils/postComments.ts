import type { PostComment } from "../types";

export const MAX_POST_COMMENT_LENGTH = 500;
const MAX_STORED_COMMENTS = 2000;

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

export function normalizePostCommentBody(value: string) {
  return value.trim().slice(0, MAX_POST_COMMENT_LENGTH);
}

export function normalizePostComment(value: unknown): PostComment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const comment = value as Record<string, unknown>;
  if (
    !isNonEmptyString(comment.id, 180) ||
    !isNonEmptyString(comment.playerId, 180) ||
    !isNonEmptyString(comment.authorUserId, 180) ||
    !isNonEmptyString(comment.authorProfileId, 220) ||
    !isNonEmptyString(comment.authorName, 80) ||
    typeof comment.authorUsername !== "string" ||
    comment.authorUsername.trim().length > 30 ||
    !isNonEmptyString(comment.body, MAX_POST_COMMENT_LENGTH) ||
    typeof comment.createdAt !== "string" ||
    !Number.isFinite(Date.parse(comment.createdAt))
  ) {
    return null;
  }

  return {
    authorName: comment.authorName.trim(),
    authorProfileId: comment.authorProfileId.trim(),
    authorUserId: comment.authorUserId.trim(),
    authorUsername: comment.authorUsername.trim(),
    body: comment.body.trim(),
    createdAt: comment.createdAt,
    id: comment.id.trim(),
    playerId: comment.playerId.trim()
  };
}

export function normalizePostComments(value: unknown): PostComment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizePostComment)
    .filter((comment): comment is PostComment => Boolean(comment))
    .slice(-MAX_STORED_COMMENTS);
}

export function groupPostCommentsByPlayer(comments: PostComment[]) {
  return comments.reduce<Record<string, PostComment[]>>((grouped, comment) => {
    grouped[comment.playerId] = [...(grouped[comment.playerId] ?? []), comment];
    return grouped;
  }, {});
}

export function removeOwnedPostComment(
  comments: PostComment[],
  commentId: string,
  userId: string
) {
  return comments.filter(
    (comment) => comment.id !== commentId || comment.authorUserId !== userId
  );
}

export function formatPostCommentAge(createdAt: string, now = Date.now()) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - Date.parse(createdAt)) / 1000)
  );

  if (elapsedSeconds < 60) return "agora";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} h`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} d`;

  return new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });
}