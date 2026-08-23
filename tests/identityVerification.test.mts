import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mercadoPago = readFileSync("functions/src/mercadoPago.ts", "utf8");
const identityBackend = readFileSync(
  "functions/src/identityVerification.ts",
  "utf8"
);
const dashboard = readFileSync(
  "src/screens/ProfessionalDashboardScreen.tsx",
  "utf8"
);
const identityScreen = readFileSync(
  "src/screens/IdentityVerificationScreen.tsx",
  "utf8"
);
const promoteScreen = readFileSync(
  "src/screens/PromotePostScreen.tsx",
  "utf8"
);

test("selo exige assinatura autorizada e identidade aprovada", () => {
  assert.match(mercadoPago, /const PLUS_AMOUNT = 9\.9/);
  assert.match(mercadoPago, /identity\.data\(\)\?\.status !== "approved"/);
  assert.match(
    identityBackend,
    /identityVerified && subscription\.data\(\)\?\.status === "authorized"/
  );
});

test("aplicativo não envia RG ou CPF para armazenamento próprio", () => {
  assert.doesNotMatch(identityBackend, /R2_|PutObjectCommand|cpfDigest|rgDigest/);
  assert.doesNotMatch(identityScreen, /TextInput|launchImageLibraryAsync/);
  assert.match(identityScreen, /provedor de verificação documental/);
});

test("ferramentas profissionais ficam livres e impulsionamento não é simulado", () => {
  assert.doesNotMatch(dashboard, /LockedFeature|LockKeyhole/);
  assert.match(dashboard, /Ferramentas profissionais para todos/);
  assert.match(dashboard, /cobrado por campanha/);
  assert.doesNotMatch(promoteScreen, /estimateCampaignReach|pessoas alcançadas/);
  assert.match(promoteScreen, /disabled/);
  assert.match(promoteScreen, /Nenhuma cobrança foi realizada/);
});
