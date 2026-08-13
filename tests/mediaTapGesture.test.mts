import assert from "node:assert/strict";
import test from "node:test";
import {
  createMediaTapGestureState,
  resolveMediaTapGesture,
  suppressMediaTapGesture
} from "../src/utils/mediaTapGesture.ts";

test("reconhece dois toques próximos como toque duplo", () => {
  const first = resolveMediaTapGesture(createMediaTapGestureState(), 1_000);
  const second = resolveMediaTapGesture(first.state, 1_180);

  assert.equal(first.action, "schedule-single");
  assert.equal(second.action, "double");
});

test("ignora o terceiro toque residual para não pausar o reel", () => {
  const first = resolveMediaTapGesture(createMediaTapGestureState(), 1_000);
  const second = resolveMediaTapGesture(first.state, 1_160);
  const third = resolveMediaTapGesture(second.state, 1_240);

  assert.equal(second.action, "double");
  assert.equal(third.action, "ignore");
  assert.equal(third.state.pendingTapAt, null);
});

test("aceita um novo gesto depois da janela de proteção", () => {
  const first = resolveMediaTapGesture(createMediaTapGestureState(), 1_000);
  const second = resolveMediaTapGesture(first.state, 1_150);
  const ignored = resolveMediaTapGesture(second.state, 1_300);
  const next = resolveMediaTapGesture(ignored.state, 1_500);

  assert.equal(ignored.action, "ignore");
  assert.equal(next.action, "schedule-single");
});
test("soltar um toque longo nao agenda uma pausa residual", () => {
  const pending = resolveMediaTapGesture(createMediaTapGestureState(), 1_000);
  const suppressed = suppressMediaTapGesture(pending.state, 1_300);
  const releaseTap = resolveMediaTapGesture(suppressed, 1_310);
  const nextTap = resolveMediaTapGesture(releaseTap.state, 1_800);

  assert.equal(suppressed.pendingTapAt, null);
  assert.equal(releaseTap.action, "ignore");
  assert.equal(nextTap.action, "schedule-single");
});