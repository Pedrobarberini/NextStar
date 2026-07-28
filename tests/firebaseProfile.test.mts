import assert from "node:assert/strict";
import test from "node:test";
import { normalizePublicProfileDocument } from "../src/utils/firebaseProfileDocument.ts";

const profile = {
  age: 22,
  bio: "Criador de conteúdo esportivo e campanhas locais.",
  city: "São Paulo, SP",
  club: "Projeto Xolot",
  name: "Pessoa Criadora",
  photoURL: "https://example.com/avatar.jpg",
  position: "Criador",
  profileCompleted: true,
  uid: "uid-seguro-1",
  username: "pessoa.criadora"
};

test("normaliza apenas os campos públicos permitidos", () => {
  const normalized = normalizePublicProfileDocument(profile.uid, {
    ...profile,
    email: "privado@example.com",
    role: "Admin",
    passwordHash: "não-deve-sair"
  });

  assert.deepEqual(normalized, profile);
  assert.equal("email" in (normalized ?? {}), false);
  assert.equal("role" in (normalized ?? {}), false);
  assert.equal("passwordHash" in (normalized ?? {}), false);
});

test("rejeita perfil com uid, username ou idade inválidos", () => {
  assert.equal(
    normalizePublicProfileDocument(profile.uid, { ...profile, uid: "outro" }),
    null
  );
  assert.equal(
    normalizePublicProfileDocument(profile.uid, { ...profile, username: "Inválido" }),
    null
  );
  assert.equal(
    normalizePublicProfileDocument(profile.uid, { ...profile, age: 4 }),
    null
  );
});
