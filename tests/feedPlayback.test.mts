import assert from "node:assert/strict";
import test from "node:test";
import { selectFeedPlaybackIndex } from "../src/utils/feedPlayback.ts";

test("mantem exatamente um player ativo quando o feed esta parado", () => {
  const activeIndex = selectFeedPlaybackIndex({
    activeIndex: 1,
    hasOverlay: false,
    isNavigating: false,
    itemCount: 3
  });

  assert.equal(activeIndex, 1);
  assert.equal(
    [0, 1, 2].filter((index) => index === activeIndex).length,
    1
  );
});

test("desmonta todos os players durante a navegacao do feed", () => {
  assert.equal(
    selectFeedPlaybackIndex({
      activeIndex: 1,
      hasOverlay: false,
      isNavigating: true,
      itemCount: 3
    }),
    null
  );
});

test("desmonta o player quando uma sobreposicao esta aberta", () => {
  assert.equal(
    selectFeedPlaybackIndex({
      activeIndex: 0,
      hasOverlay: true,
      isNavigating: false,
      itemCount: 2
    }),
    null
  );
});

test("limita o indice ativo a colecao disponivel", () => {
  assert.equal(
    selectFeedPlaybackIndex({
      activeIndex: 8,
      hasOverlay: false,
      isNavigating: false,
      itemCount: 2
    }),
    1
  );
  assert.equal(
    selectFeedPlaybackIndex({
      activeIndex: -3,
      hasOverlay: false,
      isNavigating: false,
      itemCount: 2
    }),
    0
  );
});