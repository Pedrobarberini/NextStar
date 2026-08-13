import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountFunction = readFileSync(
  new URL("../functions/src/account.ts", import.meta.url),
  "utf8",
);
const accountService = readFileSync(
  new URL("../src/services/firebaseAccountService.ts", import.meta.url),
  "utf8",
);
const discoveryScreen = readFileSync(
  new URL("../src/screens/ProfileDiscoveryScreen.tsx", import.meta.url),
  "utf8",
);

test("conclusao da conta ocorre no servidor para uma identidade verificada", () => {
  assert.match(accountFunction, /requireVerifiedUser\(request\)/);
  assert.match(accountFunction, /pendingAccounts\/\$\{uid\}/);
  assert.match(accountFunction, /request\.data\?\.acceptedTerms === true/);
  assert.match(accountFunction, /transaction\.create\(accountReference/);
  assert.match(accountFunction, /transaction\.delete\(pendingReference\)/);
});

test("login recupera cadastro incompleto pela Function autenticada", () => {
  assert.match(accountService, /finalizeAccountRegistration/);
  assert.match(accountService, /AccountCompletionRequiredError/);
  assert.match(accountService, /getIdToken\(true\)/);
});

test("busca abre em sugestoes e consulta todas as contas quando ha texto", () => {
  assert.match(discoveryScreen, /useState<SearchMode>\("suggestions"\)/);
  assert.match(discoveryScreen, /normalizedQuery\s*\? allProfiles\.filter/);
});
