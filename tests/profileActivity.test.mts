import assert from "node:assert/strict";
import test from "node:test";
import { formatProfileActivity } from "../src/utils/profileActivity.ts";

test("formata modalidade como categoria principal e função como especialidade", () => {
  assert.equal(
    formatProfileActivity("Futebol", "Ponta", "São Paulo, SP"),
    "Futebol · Ponta | São Paulo, SP"
  );
});

test("omite marcadores legados sem informação", () => {
  assert.equal(
    formatProfileActivity(
      "Modalidade não informada",
      "Área não informada",
      "Recife, PE"
    ),
    "Recife, PE"
  );
});
