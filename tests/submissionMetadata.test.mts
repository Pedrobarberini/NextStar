import assert from "node:assert/strict";
import test from "node:test";
import {
  findActiveMention,
  insertMentionSuggestion,
  parseSubmissionTokens,
  selectMentionCandidates,
  toggleSubmissionMention
} from "../src/utils/submissionMetadata.ts";

test("normaliza tags sem duplicar e respeita o limite", () => {
  assert.deepEqual(
    parseSubmissionTokens("#Treino treino, #futebol; técnica", "#", 3),
    ["Treino", "futebol", "técnica"]
  );
});

test("normaliza marcacoes removendo caracteres invalidos", () => {
  assert.deepEqual(
    parseSubmissionTokens("@clube.oficial @@Projeto-10 pessoa!", "@"),
    ["clube.oficial", "Projeto-10", "pessoa"]
  );
});

test("busca somente contas marcaveis por nome ou username", () => {
  const users = [
    {
      city: "Sao Paulo",
      id: "user-current",
      name: "Conta Atual",
      position: "Ponta",
      role: "Usuário" as const,
      username: "conta.atual"
    },
    {
      city: "Santos",
      id: "user-ana",
      name: "Ana Vitória",
      position: "Meia",
      role: "Usuário" as const,
      username: "ana.vitoria"
    },
    {
      city: "Sao Paulo",
      id: "admin",
      name: "Admin",
      position: "",
      role: "Admin" as const,
      username: "admin"
    }
  ];

  assert.deepEqual(
    selectMentionCandidates(users, "user-current", "@ana").map(
      (user) => user.id
    ),
    ["user-ana"]
  );
  assert.deepEqual(
    selectMentionCandidates(users, "user-current", "vitoria").map(
      (user) => user.id
    ),
    ["user-ana"]
  );
  assert.deepEqual(
    selectMentionCandidates(users, "user-current", "conta"),
    []
  );
});

test("adiciona e remove marcacoes respeitando o limite", () => {
  assert.deepEqual(toggleSubmissionMention([], "ana.vitoria"), [
    "ana.vitoria"
  ]);
  assert.deepEqual(
    toggleSubmissionMention(["ana.vitoria"], "ANA.VITORIA"),
    []
  );
  assert.deepEqual(
    toggleSubmissionMention(["um", "dois"], "tres", 2),
    ["um", "dois"]
  );
});

test("pop-up sugere perfis mesmo antes de digitar a busca", () => {
  const users = [
    {
      city: "Santos",
      id: "user-ana",
      name: "Ana Vitória",
      position: "Meia",
      role: "Usuário" as const,
      username: "ana.vitoria"
    }
  ];

  assert.deepEqual(
    selectMentionCandidates(users, "user-current", "", 5, true).map(
      (user) => user.username
    ),
    ["ana.vitoria"]
  );
});

test("insere a sugestão no @ ativo sem alterar o restante do comentário", () => {
  const body = "Bom lance @ana hoje";
  const active = findActiveMention(body, 14);
  assert.deepEqual(active, { end: 14, query: "ana", start: 10 });
  assert.deepEqual(
    active ? insertMentionSuggestion(body, "ana.vitoria", active) : null,
    {
      cursor: 23,
      value: "Bom lance @ana.vitoria hoje"
    }
  );
});