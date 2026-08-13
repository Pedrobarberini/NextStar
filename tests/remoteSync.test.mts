import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountsHook = readFileSync(
  new URL("../src/actions/useFirebaseAccounts.ts", import.meta.url),
  "utf8"
);
const postsHook = readFileSync(
  new URL("../src/actions/useFirebasePosts.ts", import.meta.url),
  "utf8"
);
const postService = readFileSync(
  new URL("../src/services/firebasePostService.ts", import.meta.url),
  "utf8"
);
const profileService = readFileSync(
  new URL("../src/services/firebaseProfileService.ts", import.meta.url),
  "utf8"
);

test("perfil legado concluído restaura a sessão sem depender do documento interno", () => {
  assert.match(accountsHook, /appUser\.profileCompleted \|\|/);
  assert.match(accountsHook, /waitForFirebaseAccount\(firebaseUser\.uid\)/);
});

test("snapshot remoto só inicia depois do cache e substitui publicações locais", () => {
  assert.match(postsHook, /if \(!isLocalStateLoaded\)/);
  assert.match(postsHook, /setSubmissions\(\[\]\);[\s\S]*subscribeFirebasePosts/);
  assert.match(postsHook, /getSafeFirebasePostSyncMessage/);
});

test("consulta pública inclui perfis legados e reels inválidos geram diagnóstico", () => {
  assert.equal(profileService.includes('orderBy("updatedAt", "desc")'), false);
  assert.match(postService, /onWarning\?: \(warning: Error\) => void/);
  assert.match(postService, /invalidDocuments \+ unavailableMedia/);
});
