import assert from "node:assert/strict";
import test from "node:test";
import { setContentSafetySelection } from "../src/utils/contentSafety.ts";

test("registra uma ocultacao ou denuncia sem duplicar o conteudo", () => {
  assert.deepEqual(
    setContentSafetySelection(["video-a"], "video-a", true),
    ["video-a"]
  );
  assert.deepEqual(
    setContentSafetySelection(["video-a"], "video-b", true),
    ["video-a", "video-b"]
  );
});

test("desfaz uma ocultacao ou denuncia sem alterar os demais itens", () => {
  assert.deepEqual(
    setContentSafetySelection(["video-a", "video-b"], "video-a", false),
    ["video-b"]
  );
});
