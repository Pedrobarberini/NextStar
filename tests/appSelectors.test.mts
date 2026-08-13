import assert from "node:assert/strict";
import test from "node:test";
import {
  isOwnAccountProfile,
  isOwnPlayerProfile,
  selectActiveCampaignPlayerIds,
  selectApprovedPlayerForSubmission,
  selectApprovedSubmissionPlayers,
  selectCurrentUserCampaigns,
  selectOrderedFeedPlayers,
  selectPendingReviews,
  selectPlayersByOwner,
  selectProfessionalSettings,
  selectProfileAccount,
  selectProfileFollowers,
  selectProfileFollowing,
  selectProfileId,
  selectProfileVideos,
  selectUserSubmissions,
  selectVisibleFeedPlayers
} from "../src/app/appSelectors.ts";
import type {
  AppUser,
  Player,
  PromotionCampaign,
  VideoSubmission
} from "../src/types.ts";

const basePlayer: Player = {
  age: 18,
  city: "São Paulo, SP",
  club: "Projeto Teste",
  highlight: "Conteúdo de teste",
  id: "base",
  name: "Perfil Base",
  position: "Ponta",
  profileId: "profile-base",
  tags: ["Teste"],
  videoLength: "0:05",
  videoTitle: "Publicação de teste",
  videoUri: "test.mp4"
};

const completeUser: AppUser = {
  acceptedTerms: true,
  age: 17,
  bio: "Criador completo para teste dos seletores.",
  city: "Rio de Janeiro, RJ",
  club: "Projeto Teste",
  email: "criador@xolot.local",
  id: "usuario-criador",
  name: "Criador Completo",
  position: "Criador",
  profileCompleted: true,
  role: "Usuário",
  username: "criador"
};

const otherUser: AppUser = {
  ...completeUser,
  email: "marca@xolot.local",
  id: "usuario-marca",
  name: "Marca Local",
  username: "marca.local"
};

const approvedSubmission: VideoSubmission = {
  age: 18,
  athleteName: "Nome do Envio",
  city: "São Paulo, SP",
  club: "Projeto Xolot",
  hasGuardianConsent: false,
  highlight: "Texto da publicação",
  id: "video-aprovado",
  position: "Criador",
  status: "Aprovado",
  submittedAt: "2026-07-18T12:00:00.000Z",
  userId: completeUser.id,
  videoLink: "https://xolot.test/video.mp4",
  videoTitle: "Nova campanha"
};

const campaign: PromotionCampaign = {
  budget: 50,
  clicks: 0,
  createdAt: "2026-07-25T12:00:00.000Z",
  durationDays: 7,
  estimatedReach: 4000,
  id: "campaign-1",
  impressions: 0,
  messages: 0,
  objective: "reach",
  ownerUserId: completeUser.id,
  playerId: "promoted",
  profileId: `profile-${completeUser.id}`,
  status: "active",
  title: "Nova campanha"
};

test("seleciona publicações aprovadas e aplica dados atuais do perfil", () => {
  const players = selectApprovedSubmissionPlayers(
    [
      approvedSubmission,
      { ...approvedSubmission, id: "pendente", status: "Em revisão" },
      { ...approvedSubmission, id: "sem-link", videoLink: " " }
    ],
    [completeUser]
  );

  assert.equal(players.length, 1);
  assert.equal(players[0]?.id, "approved-video-aprovado");
  assert.equal(players[0]?.name, completeUser.name);
  assert.equal(players[0]?.username, completeUser.username);
  assert.equal(players[0]?.mediaType, "video");
});

test("mantém a lista vazia quando não existem publicações reais", () => {
  assert.deepEqual(selectApprovedSubmissionPlayers([], []), []);
});

test("preserva foto, tags e marcações da publicação", () => {
  const [player] = selectApprovedSubmissionPlayers(
    [{ ...approvedSubmission, id: "foto", mediaType: "image", mentions: ["marca.local"], tags: ["Produto"], videoLink: "foto.jpg" }],
    [completeUser]
  );

  assert.equal(player?.mediaType, "image");
  assert.equal(player?.hasAudio, false);
  assert.deepEqual(player?.tags, ["Produto"]);
  assert.deepEqual(player?.mentions, ["marca.local"]);
});

test("prioriza campanha ativa, depois perfis seguidos e interesse", () => {
  const players = [
    { ...basePlayer, id: "a", profileId: "profile-a", tags: ["Produto"] },
    { ...basePlayer, id: "b", profileId: "profile-b", tags: ["Serviço"] },
    { ...basePlayer, id: "promoted", profileId: "profile-c", tags: ["Outro"] }
  ];

  assert.deepEqual(
    selectOrderedFeedPlayers(
      players,
      new Set(["profile-b"]),
      new Set(["tag:produto"]),
      new Set(["promoted"])
    ).map((player) => player.id),
    ["promoted", "b", "a"]
  );
});

test("filtra conteúdo oculto, perfil bloqueado e categoria silenciada", () => {
  const players = [
    { ...basePlayer, id: "a", profileId: "profile-a", tags: ["Produto"] },
    { ...basePlayer, id: "b", profileId: "profile-b", tags: ["Serviço"] }
  ];

  assert.deepEqual(
    selectVisibleFeedPlayers(
      players,
      new Set(["a"]),
      null,
      new Set(["profile-b"]),
      new Set()
    ),
    []
  );
  assert.deepEqual(
    selectVisibleFeedPlayers(players, new Set(["a"]), "a").map((player) => player.id),
    ["a", "b"]
  );
});

test("seleciona campanhas e configurações profissionais por usuário", () => {
  const settings = {
    [completeUser.id]: {
      category: "creator" as const,
      enabled: true,
      externalLink: "https://xolot.com.br",
      plan: "pro" as const,
      updatedAt: "2026-07-25T12:00:00.000Z"
    }
  };

  assert.deepEqual(selectCurrentUserCampaigns([campaign], completeUser), [campaign]);
  assert.deepEqual([...selectActiveCampaignPlayerIds([campaign])], ["promoted"]);
  assert.equal(selectProfessionalSettings(settings, completeUser.id)?.plan, "pro");
});

test("seleciona relações e dados derivados do perfil", () => {
  const player = {
    ...basePlayer,
    id: "video-criador",
    ownerUserId: completeUser.id,
    profileId: `profile-${completeUser.id}`
  };

  assert.equal(selectPendingReviews([{ ...approvedSubmission, status: "Em revisão" }]), 1);
  assert.equal(selectProfileAccount(null, player, [completeUser])?.id, completeUser.id);
  assert.deepEqual(selectProfileFollowers(player.profileId, { [player.profileId]: [completeUser.id] }, [completeUser]), [completeUser]);
  assert.deepEqual(selectProfileFollowing([`profile-${otherUser.id}`, player.profileId], [completeUser, otherUser]), [otherUser, completeUser]);
  assert.deepEqual(selectProfileVideos(player, [basePlayer, player]), [player]);
  assert.equal(selectProfileId(player, completeUser), player.profileId);
  assert.deepEqual(selectPlayersByOwner([basePlayer, player], completeUser.id), [player]);
  assert.equal(selectApprovedPlayerForSubmission([{ ...player, id: "approved-video-aprovado" }], approvedSubmission.id)?.id, "approved-video-aprovado");
  assert.deepEqual(selectUserSubmissions([approvedSubmission], completeUser.id), [approvedSubmission]);
});

test("identifica a própria conta e o próprio perfil", () => {
  const player = { ...basePlayer, ownerUserId: completeUser.id, profileId: `profile-${completeUser.id}` };
  assert.equal(isOwnAccountProfile(completeUser, completeUser.id), true);
  assert.equal(isOwnAccountProfile(otherUser, completeUser.id), false);
  assert.equal(isOwnPlayerProfile(player, completeUser.id, player.profileId), true);
});
