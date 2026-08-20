import assert from "node:assert/strict";
import test from "node:test";
import type { Player, VideoSubmission } from "../src/types.ts";
import {
  buildTagAffinityScores,
  getPlayerTagAffinityScore,
  mergeTagCatalog,
  normalizeTagKey,
  normalizeTagLabel,
  normalizeTagList,
  searchTagCatalog
} from "../src/utils/tagCatalog.ts";

function submission(
  id: string,
  userId: string,
  tags: string[]
): VideoSubmission {
  return {
    age: 18,
    athleteName: "Perfil",
    city: "São Paulo",
    club: "",
    hasGuardianConsent: true,
    highlight: "Descrição de teste",
    id,
    position: "Criador",
    status: "Aprovado",
    submittedAt: "2026-08-20T12:00:00.000Z",
    tags,
    userId,
    videoLink: "https://media.xolot.com.br/video.mp4",
    videoTitle: "Publicação"
  };
}

function player(id: string, tags: string[]): Player {
  return {
    age: 18,
    city: "São Paulo",
    club: "",
    hasAudio: true,
    highlight: "Descrição",
    id,
    name: "Perfil",
    position: "Criador",
    profileId: `profile-${id}`,
    tags,
    videoLength: "0:10",
    videoTitle: "Publicação",
    videoUri: "video.mp4"
  };
}

test("normaliza hashtags personalizadas com uma chave estável", () => {
  assert.equal(normalizeTagKey("  #Futebol Feminino  "), "futebol-feminino");
  assert.equal(normalizeTagKey("Counter-Strike 2"), "counter-strike-2");
  assert.equal(normalizeTagLabel(" ##Vôlei!! de praia "), "Vôlei de praia");
});

test("lista elimina variações equivalentes e preserva o primeiro rótulo", () => {
  assert.deepEqual(
    normalizeTagList(["#Futebol", "futebol", "FUTEBÓL", "Vôlei"], 6),
    ["Futebol", "Vôlei"]
  );
});

test("busca encontra uma hashtag criada por parte do nome", () => {
  const catalog = [
    { creatorCount: 2, key: "valorant", label: "Valorant", postCount: 4 },
    { creatorCount: 1, key: "futebol", label: "Futebol", postCount: 2 }
  ];
  assert.deepEqual(
    searchTagCatalog(catalog, "valo").map((entry) => entry.key),
    ["valorant"]
  );
});
test("catálogo conta publicações e autores únicos sem duplicar hashtags", () => {
  const catalog = mergeTagCatalog([], [
    submission("a", "user-1", ["Valorant", "valorant"]),
    submission("b", "user-1", ["Valorant"]),
    submission("c", "user-2", ["Valorant"])
  ]);
  const valorant = catalog.find((entry) => entry.key === "valorant");
  assert.equal(valorant?.postCount, 3);
  assert.equal(valorant?.creatorCount, 2);
});

test("interesses declarados têm prioridade e curtidas aprendem todas as tags", () => {
  const players = [
    player("liked", ["Valorant", "Clutch"]),
    player("other", ["Futebol"])
  ];
  const scores = buildTagAffinityScores(
    ["Futebol"],
    new Set<string>(),
    new Set(["liked"]),
    players
  );
  assert.equal(scores.get("tag:futebol"), 100);
  assert.equal(scores.get("tag:valorant"), 12);
  assert.equal(scores.get("tag:clutch"), 12);
  assert.equal(getPlayerTagAffinityScore(players[0], scores), 24);
  assert.equal(getPlayerTagAffinityScore(players[1], scores), 100);
});