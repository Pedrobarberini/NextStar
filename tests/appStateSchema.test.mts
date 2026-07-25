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

test("migra estado antigo preservando conta e descartando carteira e investimentos", () => {
  const fallback = createDefaultLocalAppState();
  const migrated = migrateLocalAppState(
    {
      activeUser: {
        acceptedTerms: true,
        email: "teste@xolot.local",
        id: "usuario-teste",
        name: "Teste",
        role: "Usuário"
      },
      athleteFunds: [{ id: "fund-antigo" }],
      investments: [{ id: "investment-antigo" }],
      registeredUsers: [],
      submissions: [],
      walletBalances: { "usuario-teste": 350 }
    },
    fallback
  );

  assert.equal(migrated.version, APP_STATE_SCHEMA_VERSION);
  assert.equal(migrated.activeUser?.id, "usuario-teste");
  assert.equal(migrated.activeUser?.profileCompleted, false);
  assert.equal(migrated.activeUser?.username, "teste");
  assert.equal(migrated.registeredUsers[0]?.id, "usuario-teste");
  assert.deepEqual(migrated.campaigns, []);
  assert.deepEqual(migrated.professionalSettingsByUser, {});
  assert.equal("walletBalances" in migrated, false);
  assert.equal("athleteFunds" in migrated, false);
  assert.equal("investments" in migrated, false);
});

test("preserva perfil completo e credencial sem expor senha em texto", () => {
  const migrated = migrateLocalAppState(
    {
      activeUser: null,
      registeredUsers: [
        {
          acceptedTerms: true,
          age: 27,
          bio: "Criador focado em publicidade e conteúdo local.",
          city: "São Paulo, SP",
          club: "Estúdio Xolot",
          email: "criador@xolot.local",
          id: "usuario-criador",
          name: "Criador Xolot",
          passwordHash: "hash-seguro",
          passwordSalt: "salt-aleatório",
          position: "Criador",
          profileCompleted: true,
          role: "Usuário"
        }
      ]
    },
    createDefaultLocalAppState()
  );

  assert.equal(migrated.registeredUsers[0]?.profileCompleted, true);
  assert.equal(migrated.registeredUsers[0]?.passwordHash, "hash-seguro");
  assert.equal(migrated.registeredUsers[0]?.username, "criador");
  assert.equal("password" in migrated.registeredUsers[0], false);
});

test("migra usernames repetidos para identificadores únicos", () => {
  const migrated = migrateLocalAppState(
    {
      activeUser: null,
      registeredUsers: [
        { acceptedTerms: true, email: "primeiro@xolot.local", id: "primeiro", name: "Pedro", role: "Usuário", username: "pedro" },
        { acceptedTerms: true, email: "segundo@xolot.local", id: "segundo", name: "Pedro", role: "Usuário", username: "Pedro" }
      ]
    },
    createDefaultLocalAppState()
  );

  assert.deepEqual(migrated.registeredUsers.map((account) => account.username), ["pedro", "pedro_2"]);
});

test("normaliza campanhas e configurações profissionais válidas", () => {
  const migrated = migrateLocalAppState(
    {
      activeUser: null,
      campaigns: [campaign, { id: "incompleta" }],
      professionalSettingsByUser: {
        "usuario-teste": professionalSettings,
        inválido: null
      },
      registeredUsers: [],
      submissions: []
    },
    createDefaultLocalAppState()
  );

  assert.deepEqual(migrated.campaigns, [campaign]);
  assert.deepEqual(migrated.professionalSettingsByUser, {
    "usuario-teste": professionalSettings
  });
});

test("serialização e leitura preservam o estado profissional completo", () => {
  const state = {
    ...createDefaultLocalAppState(),
    campaigns: [campaign],
    professionalSettingsByUser: { "usuario-teste": professionalSettings }
  };
  const restored = parseLocalAppState(
    serializeLocalAppState(state),
    createDefaultLocalAppState()
  );

  assert.deepEqual(restored, state);
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
