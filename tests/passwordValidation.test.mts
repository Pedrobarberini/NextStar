import assert from "node:assert/strict";
import test from "node:test";
import {
  getPasswordRequirements,
  getPasswordValidationMessage,
  isStrongPassword
} from "../src/utils/passwordValidation.ts";

test("exige todos os requisitos da senha", () => {
  assert.equal(isStrongPassword("Xolot123"), true);
  assert.equal(isStrongPassword("xolot123"), false);
  assert.equal(isStrongPassword("XOLOT123"), false);
  assert.equal(isStrongPassword("XolotApp"), false);
  assert.equal(isStrongPassword("Xol1"), false);
});

test("informa exatamente qual requisito ainda falta", () => {
  assert.equal(getPasswordValidationMessage(""), "Digite uma senha.");
  assert.equal(
    getPasswordValidationMessage("Xol1"),
    "A senha precisa ter pelo menos 8 caracteres."
  );
  assert.equal(
    getPasswordValidationMessage("xolot123"),
    "Adicione pelo menos uma letra maiúscula à senha."
  );
  assert.equal(
    getPasswordValidationMessage("XOLOT123"),
    "Adicione pelo menos uma letra minúscula à senha."
  );
  assert.equal(
    getPasswordValidationMessage("XolotApp"),
    "Adicione pelo menos um número à senha."
  );
  assert.equal(getPasswordValidationMessage("Xolot123"), "");
});

test("expõe o estado individual dos requisitos para a interface", () => {
  assert.deepEqual(
    getPasswordRequirements("XolotApp").map(({ id, met }) => ({ id, met })),
    [
      { id: "length", met: true },
      { id: "uppercase", met: true },
      { id: "lowercase", met: true },
      { id: "number", met: false }
    ]
  );
});
