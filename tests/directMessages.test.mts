import assert from "node:assert/strict";
import test from "node:test";
import type { DirectMessage } from "../src/types.ts";
import {
  formatDirectMessageTime,
  getDirectMessageReceiptState
} from "../src/utils/directMessages.ts";

const baseMessage: DirectMessage = {
  body: "Ola",
  createdAt: "2026-08-12T15:07:00.000Z",
  id: "message-1",
  recipientUserId: "user-2",
  senderUserId: "user-1"
};

test("classifica os recibos de mensagem em ordem de progresso", () => {
  assert.equal(getDirectMessageReceiptState(baseMessage), "sent");
  assert.equal(
    getDirectMessageReceiptState({
      ...baseMessage,
      deliveredAt: "2026-08-12T15:08:00.000Z"
    }),
    "delivered"
  );
  assert.equal(
    getDirectMessageReceiptState({
      ...baseMessage,
      deliveredAt: "2026-08-12T15:08:00.000Z",
      readAt: "2026-08-12T15:09:00.000Z"
    }),
    "read"
  );
});

test("prioriza a leitura mesmo em mensagens legadas sem deliveredAt", () => {
  assert.equal(
    getDirectMessageReceiptState({
      ...baseMessage,
      readAt: "2026-08-12T15:09:00.000Z"
    }),
    "read"
  );
});

test("formata data e horario e ignora datas invalidas", () => {
  assert.match(
    formatDirectMessageTime(baseMessage.createdAt),
    /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/
  );
  assert.equal(formatDirectMessageTime("data-invalida"), "");
});
