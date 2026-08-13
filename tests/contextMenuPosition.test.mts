import assert from "node:assert/strict";
import test from "node:test";
import { getContextMenuPosition } from "../src/utils/contextMenuPosition.ts";

test("abre o menu para dentro da tela conforme o lado tocado", () => {
  const fromLeft = getContextMenuPosition({
    anchorX: 40,
    anchorY: 100,
    viewportHeight: 800,
    viewportWidth: 400
  });
  const fromRight = getContextMenuPosition({
    anchorX: 360,
    anchorY: 100,
    viewportHeight: 800,
    viewportWidth: 400
  });

  assert.equal(fromLeft.left, 18);
  assert.equal(fromRight.left, 186);
  assert.equal(fromLeft.top, 88);
  assert.equal(fromRight.top, 88);
});

test("mantem o menu dentro das margens em telas pequenas", () => {
  assert.deepEqual(
    getContextMenuPosition({
      anchorX: 390,
      anchorY: 790,
      menuHeight: 154,
      menuWidth: 196,
      viewportHeight: 800,
      viewportWidth: 400
    }),
    { left: 192, top: 634 }
  );
  assert.deepEqual(
    getContextMenuPosition({
      anchorX: 2,
      anchorY: 2,
      menuHeight: 154,
      menuWidth: 196,
      viewportHeight: 800,
      viewportWidth: 400
    }),
    { left: 12, top: 12 }
  );
});
