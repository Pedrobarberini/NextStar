import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

test("regras do Firestore exigem conta registrada, email verificado e deny by default", () => {
  assert.match(rules, /rules_version = '2'/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /function registeredVerifiedUser/);
  assert.match(rules, /documents\/accounts\/\$\(request\.auth\.uid\)/);
  assert.match(rules, /return registeredVerifiedUser\(\) && request\.auth\.uid == uid/);
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});

test("documentos privados não podem ser listados ou alterados pelo cliente", () => {
  assert.match(rules, /match \/accounts\/\{uid\}/);
  assert.match(rules, /allow list: if false/);
  assert.match(rules, /allow update, delete: if false/);
  assert.match(rules, /authProvider.*createdAt.*termsAcceptedAt.*uid/s);
});

test("perfil e username são validados e vinculados atomicamente", () => {
  assert.match(rules, /data\.keys\(\)\.hasOnly/);
  assert.match(rules, /username\.matches/);
  assert.match(rules, /existsAfter/);
  assert.match(rules, /getAfter/);
  assert.match(rules, /usernameOwnedAfter/);
  assert.match(rules, /oldUsernameReleasedAfter/);
});

test("posts e avatares remotos exigem propriedade e campos permitidos", () => {
  assert.match(rules, /function validPost/);
  assert.match(rules, /match \/posts\/\{postId\}/);
  assert.match(rules, /request\.resource\.data\.authorId == request\.auth\.uid/);
  assert.match(rules, /data\.mediaPath == 'posts\/'/);
  assert.match(rules, /data\.durationMs <= 120000/);
  assert.match(rules, /match \/profileMedia\/\{uid\}/);
  assert.match(rules, /validProfileMedia/);
  assert.match(rules, /authProvider in \['password', 'google', 'apple'\]/);
});