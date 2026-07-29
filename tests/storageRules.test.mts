import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = readFileSync(new URL("../storage.rules", import.meta.url), "utf8");

test("Storage exige email verificado, propriedade por UID e deny by default", () => {
  assert.match(rules, /rules_version = '2'/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /request\.auth\.uid == uid/);
  assert.match(rules, /match \/\{allPaths=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});

test("mídia de post é imutável e valida MIME, tamanho e metadados", () => {
  assert.match(rules, /match \/posts\/\{uid\}\/\{postId\}\/media/);
  assert.match(rules, /allow update: if false/);
  assert.match(rules, /request\.resource\.metadata\.ownerUid == uid/);
  assert.match(rules, /15 \* 1024 \* 1024/);
  assert.match(rules, /200 \* 1024 \* 1024/);
  assert.match(rules, /image\/\(jpeg\|png\|webp\|heic\|heif\)/);
  assert.match(rules, /video\/\(mp4\|quicktime\|webm\|x-m4v\|3gpp\)/);
});

test("avatar permite atualização somente pelo proprietário", () => {
  assert.match(rules, /match \/avatars\/\{uid\}\/profile/);
  assert.match(rules, /allow create, update: if owns\(uid\)/);
  assert.match(rules, /allow delete: if false/);
});
