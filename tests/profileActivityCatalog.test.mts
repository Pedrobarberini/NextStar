import assert from "node:assert/strict";
import test from "node:test";
import {
  findProfileActivity,
  getSpecialtySuggestions,
  getSportSuggestions,
  PROFILE_ACTIVITY_CATALOG
} from "../src/utils/profileActivityCatalog.ts";

test("catálogo reúne esportes tradicionais e e-sports", () => {
  assert.equal(PROFILE_ACTIVITY_CATALOG.length >= 20, true);
  assert.equal(findProfileActivity("futebol")?.sport, "Futebol");
  assert.equal(findProfileActivity("VALORANT")?.sport, "Valorant");
  assert.equal(findProfileActivity("volei")?.sport, "Vôlei");
});

test("sugere modalidades sem impedir busca por texto livre", () => {
  assert.deepEqual(getSportSuggestions("", 3), [
    "Futebol",
    "Futsal",
    "Vôlei"
  ]);
  assert.deepEqual(getSportSuggestions("counter"), ["Counter-Strike 2"]);
  assert.deepEqual(getSportSuggestions("modalidade nova"), []);
  assert.deepEqual(getSportSuggestions("Futebol"), []);
});

test("sugere funções relacionadas à modalidade escolhida", () => {
  assert.equal(
    getSpecialtySuggestions("Futebol", "").includes("Centroavante"),
    true
  );
  assert.deepEqual(getSpecialtySuggestions("Valorant", "duel"), ["Duelista"]);
  assert.deepEqual(getSpecialtySuggestions("Modalidade nova", ""), []);
});