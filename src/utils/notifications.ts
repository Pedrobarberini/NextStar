import type {
  AppNotification,
  AppNotificationKind,
  SubmissionMediaType
} from "../types";

const notificationKinds = new Set<AppNotificationKind>([
  "comment",
  "like",
  "message",
  "reply",
  "shared-post"
]);

function normalizeDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date(0).toISOString();
}

function normalizeOptionalDate(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = normalizeDate(value);
  return normalized === new Date(0).toISOString() ? undefined : normalized;
}

export function normalizeAppNotification(
  id: string,
  value: unknown
): AppNotification | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (
    typeof data.actorName !== "string" ||
    typeof data.actorUserId !== "string" ||
    typeof data.actorUsername !== "string" ||
    typeof data.kind !== "string" ||
    !notificationKinds.has(data.kind as AppNotificationKind) ||
    typeof data.recipientUserId !== "string" ||
    typeof data.sourceId !== "string"
  ) {
    return null;
  }

  const mediaType: SubmissionMediaType | undefined =
    data.mediaType === "image" || data.mediaType === "video"
      ? data.mediaType
      : undefined;
  const readAt = normalizeOptionalDate(data.readAt);

  return {
    actorName: data.actorName.trim() || "Alguém",
    actorUserId: data.actorUserId,
    actorUsername: data.actorUsername.trim(),
    createdAt: normalizeDate(data.createdAt),
    id,
    kind: data.kind as AppNotificationKind,
    ...(mediaType ? { mediaType } : {}),
    ...(typeof data.playerId === "string" && data.playerId
      ? { playerId: data.playerId }
      : {}),
    ...(typeof data.preview === "string" && data.preview.trim()
      ? { preview: data.preview.trim() }
      : {}),
    ...(readAt ? { readAt } : {}),
    recipientUserId: data.recipientUserId,
    sourceId: data.sourceId
  };
}

export function sortNotificationsNewestFirst(
  notifications: AppNotification[]
) {
  return [...notifications].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

export function getNotificationText(notification: AppNotification) {
  const actor = notification.actorName || "@" + notification.actorUsername;

  switch (notification.kind) {
    case "comment":
      return actor + " comentou na sua publicação";
    case "like":
      return actor + " curtiu sua publicação";
    case "message":
      return actor + " te mandou uma mensagem";
    case "reply":
      return actor + " respondeu ao seu comentário";
    case "shared-post":
      return (
        actor +
        " te enviou " +
        (notification.mediaType === "image" ? "uma foto" : "um vídeo")
      );
  }
}

export function formatNotificationTime(
  createdAt: string,
  now = new Date()
) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const wasYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (wasYesterday) {
    return "Ontem";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}