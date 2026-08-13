import assert from "node:assert/strict";
import test from "node:test";
import {
  collectProfileTagOptions,
  getSuggestionTagKey,
  haveNearbyLocation,
  rankProfileSuggestions
} from "../src/utils/profileSuggestions.ts";

test("normaliza hashtags para a mesma chave usada nas preferências", () => {
  assert.equal(getSuggestionTagKey("#Futebol Feminino"), "tag:futebol-feminino");
  assert.equal(getSuggestionTagKey("  Vôlei  "), "tag:volei");
});

test("lista interesses das contas sem itens genéricos ou duplicados", () => {
  const options = collectProfileTagOptions([
    { tags: ["Futebol", "futebol", "Novo"] },
    { tags: ["Vôlei", "Futebol"] }
  ]);

  assert.deepEqual(
    options.map(({ count, key }) => ({ count, key })),
    [
      { count: 2, key: "tag:futebol" },
      { count: 1, key: "tag:volei" }
    ]
  );
});

test("prioriza interesses declarados e depois a afinidade comportamental", () => {
  const profiles = [
    {
      city: "São Paulo, SP",
      name: "Ana",
      profileId: "profile-ana",
      tags: ["Futebol", "Ponta"]
    },
    {
      city: "Santos, SP",
      name: "Bia",
      profileId: "profile-bia",
      tags: ["Vôlei"]
    },
    {
      city: "Campinas, SP",
      name: "Caio",
      profileId: "profile-caio",
      tags: ["Futebol"]
    }
  ];
  const ranked = rankProfileSuggestions(
    profiles,
    new Set(["tag:futebol"]),
    {
      currentCity: "São Paulo, SP",
      profileInterestTags: ["Ponta"],
      rotationSeed: "2026-08-11"
    }
  );

  assert.deepEqual(
    ranked.map(({ profileId, suggestionScore }) => ({
      profileId,
      suggestionScore
    })),
    [
      { profileId: "profile-ana", suggestionScore: 125 },
      { profileId: "profile-caio", suggestionScore: 25 },
      { profileId: "profile-bia", suggestionScore: 0 }
    ]
  );
});

test("usa perfis da mesma região como fallback quando não há afinidade", () => {
  const ranked = rankProfileSuggestions(
    [
      { city: "Curitiba, PR", name: "Ana", profileId: "profile-ana", tags: [] },
      { city: "Santos, SP", name: "Bia", profileId: "profile-bia", tags: [] },
      { city: "Campinas, SP", name: "Caio", profileId: "profile-caio", tags: [] }
    ],
    [],
    { currentCity: "São Paulo, SP", rotationSeed: "2026-08-11" }
  );

  assert.equal(haveNearbyLocation("São Paulo, SP", "Santos, SP"), true);
  assert.equal(haveNearbyLocation("São Paulo, SP", "Curitiba, PR"), false);
  assert.equal(ranked.at(-1)?.profileId, "profile-ana");
  assert.ok(ranked.slice(0, 2).every((profile) => profile.suggestionSource === "nearby"));
});
