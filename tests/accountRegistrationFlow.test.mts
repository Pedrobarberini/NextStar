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
const authScreen = readFileSync(
  new URL("../src/screens/AuthScreen.tsx", import.meta.url),
  "utf8",
);
const accountObserver = readFileSync(
  new URL("../src/actions/useFirebaseAccounts.ts", import.meta.url),
  "utf8",
);
const discoveryScreen = readFileSync(
  new URL("../src/screens/ProfileDiscoveryScreen.tsx", import.meta.url),
  "utf8",
);
const accountSetupScreen = readFileSync(
  new URL("../src/screens/AccountSetupScreen.tsx", import.meta.url),
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

test("Google no login cria uma conta nova somente depois do aceite dos termos", () => {
  assert.match(authScreen, /mode === "login" && !needsGoogleAccountCompletion/);
  assert.match(authScreen, /setNeedsGoogleAccountCompletion\(true\)/);
  assert.match(authScreen, /completeCurrentFirebaseAccountRegistration\(true\)/);
  assert.match(authScreen, /Aceitar e continuar/);
  assert.doesNotMatch(
    authScreen,
    /Esta identidade ainda não possui uma conta Xolot\. Selecione/
  );
  assert.match(
    accountService,
    /completeCurrentFirebaseAccountRegistration[\s\S]*activateVerifiedFirebaseAccount\(authenticatedUser, true\)/
  );
});

test("a sessão Google incompleta permanece ativa para a etapa única de termos", () => {
  assert.match(
    accountObserver,
    /if \(!isGoogleFirebaseUser\(firebaseUser\)\) \{\s*void signOutFirebaseSession\(\)/
  );
  assert.match(
    accountFunction,
    /if \(!hasValidPendingAccount && !acceptedTerms\)/
  );
});

test("onboarding divide identidade, atuação e interesses em etapas curtas", () => {
  assert.match(accountSetupScreen, /Etapa \{currentStep \+ 1\} de/);
  assert.match(accountSetupScreen, /Vamos criar seu perfil/);
  assert.match(accountSetupScreen, /Como você participa/);
  assert.match(accountSetupScreen, /Monte seu Para você/);
  assert.match(accountSetupScreen, /label="Modalidade"/);
  assert.match(accountSetupScreen, /label="Função ou especialidade"/);
  assert.match(accountSetupScreen, /PROFILE_INTEREST_OPTIONS/);
  assert.match(accountSetupScreen, /pickProfilePhoto/);
});
