import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_STATE_SCHEMA_VERSION,
  createDefaultLocalAppState,
  createLocalAppStateRepository,
  migrateLocalAppState,
  parseLocalAppState,
  serializeLocalAppState
} from "../src/repositories/appStateSchema.ts";

const campaign = {
  budget: 50,
  clicks: 0,
  createdAt: "2026-07-25T12:00:00.000Z",
  durationDays: 7,
  estimatedReach: 4200,
  id: "campaign-1",
  impressions: 0,
  messages: 0,
  objective: "reach" as const,
  ownerUserId: "usuario-teste",
  playerId: "approved-video-1",
  profileId: "profile-usuario-teste",
  status: "active" as const,
  title: "Campanha de lançamento"
};

const professionalSettings = {
  category: "creator" as const,
  enabled: true,
  externalLink: "https://xolot.com.br",
  plan: "pro" as const,
  updatedAt: "2026-07-25T12:00:00.000Z"
};

test("retorna o estado inicial quando não existe valor persistido", () => {
  const fallback = createDefaultLocalAppState();
  assert.deepEqual(parseLocalAppState(null, fallback), fallback);
  assert.deepEqual(parseLocalAppState("json-inválido", fallback), fallback);
});

test("migra estado antigo descartando conta, sessão e credenciais locais", () => {
  const fallback = createDefaultLocalAppState();
  const migrated = migrateLocalAppState(
    {
      activeUser: {
        email: "teste@xolot.local",
        id: "usuario-teste",
        passwordHash: "hash-antigo",
        passwordSalt: "salt-antigo"
      },
      athleteFunds: [{ id: "fund-antigo" }],
      investments: [{ id: "investment-antigo" }],
      registeredUsers: [{ email: "teste@xolot.local", id: "usuario-teste" }],
      submissions: [],
      walletBalances: { "usuario-teste": 350 }
    },
    fallback
  );

  assert.equal(migrated.version, APP_STATE_SCHEMA_VERSION);
  assert.equal("activeUser" in migrated, false);
  assert.equal("registeredUsers" in migrated, false);
  assert.equal("passwordHash" in migrated, false);
  assert.equal("walletBalances" in migrated, false);
  assert.equal("athleteFunds" in migrated, false);
  assert.equal("investments" in migrated, false);
});

test("normaliza campanhas e configurações profissionais válidas", () => {
  const migrated = migrateLocalAppState(
    {
      campaigns: [campaign, { id: "incompleta" }],
      professionalSettingsByUser: {
        "usuario-teste": professionalSettings,
        inválido: null
      },
      submissions: []
    },
    createDefaultLocalAppState()
  );

  assert.deepEqual(migrated.campaigns, [campaign]);
  assert.deepEqual(migrated.professionalSettingsByUser, {
    "usuario-teste": professionalSettings
  });
});

test("serialização não inclui identidade ou credenciais", () => {
  const state = {
    ...createDefaultLocalAppState(),
    campaigns: [campaign],
    professionalSettingsByUser: { "usuario-teste": professionalSettings }
  };
  const serialized = serializeLocalAppState(state);
  const restored = parseLocalAppState(
    serialized,
    createDefaultLocalAppState()
  );

  assert.deepEqual(restored, state);
  assert.equal(serialized.includes("activeUser"), false);
  assert.equal(serialized.includes("registeredUsers"), false);
  assert.equal(serialized.includes("password"), false);
});

test("repositório salva, carrega e limpa o estado", async () => {
  const memory = new Map<string, string>();
  const repository = createLocalAppStateRepository(
    {
      async getItem(key) { return memory.get(key) ?? null; },
      async removeItem(key) { memory.delete(key); },
      async setItem(key, value) { memory.set(key, value); }
    },
    "app-state-test"
  );
  const fallback = createDefaultLocalAppState();
  const state = { ...fallback, campaigns: [campaign] };

  await repository.save(state);
  assert.deepEqual(await repository.load(fallback), state);
  await repository.clear();
  assert.deepEqual(await repository.load(fallback), fallback);
});