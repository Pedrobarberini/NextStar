import type { DirectMessage } from "../types";

export type DirectMessageReceiptState = "sent" | "delivered" | "read";

export function getDirectMessageReceiptState(
  message: DirectMessage
): DirectMessageReceiptState {
  if (message.readAt) {
    return "read";
  }
  if (message.deliveredAt) {
    return "delivered";
  }
  return "sent";
}

export function formatDirectMessageTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  }).format(date);

  return dateLabel + " às " + timeLabel;
}
