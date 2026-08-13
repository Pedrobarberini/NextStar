import assert from "node:assert/strict";
import test from "node:test";
import type { AppNotification } from "../src/types.ts";
import {
  formatNotificationTime,
  getNotificationText,
  normalizeAppNotification,
  sortNotificationsNewestFirst
} from "../src/utils/notifications.ts";

const notification: AppNotification = {
  actorName: "Pedro",
  actorUserId: "user-pedro",
  actorUsername: "pedro",
  createdAt: "2026-08-13T12:30:00.000Z",
  id: "notification-1",
  kind: "message",
  recipientUserId: "user-ana",
  sourceId: "message-1"
};

test("normaliza notificacoes validas e descarta dados incompletos", () => {
  assert.deepEqual(
    normalizeAppNotification("notification-1", {
      ...notification,
      createdAt: {
        toDate: () => new Date(notification.createdAt)
      }
    }),
    notification
  );
  assert.equal(
    normalizeAppNotification("notification-2", {
      actorName: "Pedro"
    }),
    null
  );
});

test("descreve mensagens, compartilhamentos, curtidas e comentarios", () => {
  assert.equal(
    getNotificationText(notification),
    "Pedro te mandou uma mensagem"
  );
  assert.equal(
    getNotificationText({
      ...notification,
      kind: "shared-post",
      mediaType: "video"
    }),
    "Pedro te enviou um vídeo"
  );
  assert.equal(
    getNotificationText({ ...notification, kind: "like" }),
    "Pedro curtiu sua publicação"
  );
  assert.equal(
    getNotificationText({ ...notification, kind: "comment" }),
    "Pedro comentou na sua publicação"
  );
  assert.equal(
    getNotificationText({ ...notification, kind: "reply" }),
    "Pedro respondeu ao seu comentário"
  );
});

test("ordena alertas recentes primeiro e formata o horario do dia", () => {
  const newest = {
    ...notification,
    createdAt: "2026-08-13T13:30:00.000Z",
    id: "notification-2"
  };

  assert.deepEqual(
    sortNotificationsNewestFirst([notification, newest]).map(
      (item) => item.id
    ),
    ["notification-2", "notification-1"]
  );
  assert.match(
    formatNotificationTime(
      notification.createdAt,
      new Date("2026-08-13T18:00:00.000Z")
    ),
    /^\d{2}:\d{2}$/
  );
});