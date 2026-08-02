import assert from "node:assert/strict";
import test from "node:test";
import {
  addProfileVideoSelection,
  getProfileVideoVisibilityIds,
  isProfileVideoHidden,
  toggleProfileVideoSelection
} from "../src/utils/profileVideoSelection.ts";

test("inicia a selecao sem duplicar o video pressionado", () => {
  assert.deepEqual(addProfileVideoSelection([], "video-1"), ["video-1"]);
  assert.deepEqual(addProfileVideoSelection(["video-1"], "video-1"), [
    "video-1"
  ]);
});

test("adiciona e remove videos por toque durante a selecao", () => {
  const selected = toggleProfileVideoSelection(["video-1"], "video-2");

  assert.deepEqual(selected, ["video-1", "video-2"]);
  assert.deepEqual(toggleProfileVideoSelection(selected, "video-1"), [
    "video-2"
  ]);
  assert.deepEqual(toggleProfileVideoSelection(["video-2"], "video-2"), []);
});

test("reconhece ocultacao pelo id publicado ou pelo id antigo do envio", () => {
  const video = {
    id: "approved-submission-1",
    sourceId: "submission-1"
  };

  assert.deepEqual(getProfileVideoVisibilityIds(video), [
    "approved-submission-1",
    "submission-1"
  ]);
  assert.equal(
    isProfileVideoHidden(new Set(["approved-submission-1"]), video),
    true
  );
  assert.equal(
    isProfileVideoHidden(new Set(["submission-1"]), video),
    true
  );
  assert.equal(isProfileVideoHidden(new Set(), video), false);
});
