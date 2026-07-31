import assert from "node:assert/strict";
import test from "node:test";
import {
  filterFollowedProfiles,
  matchesProfileSearch,
  normalizeProfileSearchValue
} from "../src/utils/profileSearch.ts";

test("normaliza caixa, espaços, arroba e acentos na busca de perfis", () => {
  assert.equal(normalizeProfileSearchValue("  João SILVA  "), "joao silva");
  assert.equal(normalizeProfileSearchValue("@Criador"), "criador");
  assert.equal(matchesProfileSearch("joao", ["João Silva"]), true);
  assert.equal(matchesProfileSearch("@criador", ["criador"]), true);
});

test("mantém somente perfis seguidos na pesquisa", () => {
  const profiles = [
    { name: "Ana", profileId: "profile-ana" },
    { name: "Bruno", profileId: "profile-bruno" }
  ];

  assert.deepEqual(filterFollowedProfiles(profiles, ["profile-bruno"]), [
    profiles[1]
  ]);
});