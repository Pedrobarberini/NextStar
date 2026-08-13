import assert from "node:assert/strict";
import test from "node:test";
import type { AppUser, DirectMessage, Player } from "../src/types.ts";
import {
  countSharedPostsByPlayer,
  createSharedPostDelivery,
  createSharedPostReference,
  getSharedPostCaption,
  selectShareContacts,
  selectShareRecipients
} from "../src/utils/socialSharing.ts";

const user: AppUser = {
  acceptedTerms: true,
  age: 18,
  bio: "Perfil completo usado pelo teste de compartilhamento.",
  city: "Sao Paulo, SP",
  club: "Projeto Teste",
  email: "jogador@xolot.test",
  id: "user-a",
  name: "Jogador A",
  position: "Ponta",
  profileCompleted: true,
  role: "Usuário",
  username: "jogadora"
};

const player: Player = {
  age: 18,
  city: "Sao Paulo, SP",
  club: "Projeto Teste",
  highlight: "Melhor lance",
  id: "player-b",
  mediaType: "video",
  name: "Jogador B",
  ownerUserId: "user-b",
  position: "Meia",
  profileId: "profile-user-b",
  tags: [],
  videoLength: "0:08",
  videoTitle: "Treino tecnico",
  videoUri: "video-b.mp4"
};

test("cria referencia persistente para uma publicacao compartilhada", () => {
  assert.deepEqual(createSharedPostReference(player), {
    authorName: player.name,
    mediaType: "video",
    playerId: player.id,
    profileId: player.profileId,
    title: player.videoTitle
  });
});

test("inclui uma mensagem opcional na referencia compartilhada", () => {
  assert.deepEqual(
    createSharedPostReference(player, "  Veja este lance  "),
    {
      authorName: player.name,
      caption: "Veja este lance",
      mediaType: "video",
      playerId: player.id,
      profileId: player.profileId,
      title: player.videoTitle
    }
  );
});

test("separa a publicacao da mensagem opcional no compartilhamento", () => {
  assert.deepEqual(createSharedPostDelivery(player, "  Veja este lance  "), [
    {
      body: "Compartilhou uma publicação",
      sharedPost: createSharedPostReference(player)
    },
    { body: "Veja este lance" }
  ]);
  assert.deepEqual(createSharedPostDelivery(player), [
    {
      body: "Compartilhou uma publicação",
      sharedPost: createSharedPostReference(player)
    }
  ]);
});

test("envia somente aos perfis selecionados quando o compartilhamento e confirmado", () => {
  const contacts = [
    {
      id: "user-b",
      name: "Jogador B",
      profileId: "profile-user-b",
      subtitle: "Meia"
    },
    {
      id: "user-c",
      name: "Jogador C",
      profileId: "profile-user-c",
      subtitle: "Goleiro"
    }
  ];

  assert.deepEqual(
    selectShareRecipients(contacts, ["user-c"]),
    [contacts[1]]
  );
  assert.deepEqual(selectShareRecipients(contacts, []), []);
});

test("recupera a mensagem anexada pelo campo persistido ou pelo corpo", () => {
  const baseMessage: DirectMessage = {
    body: "Compartilhou uma publicação",
    createdAt: "2026-07-24T00:00:00.000Z",
    id: "message-share",
    recipientUserId: "user-b",
    senderUserId: "user-a",
    sharedPost: createSharedPostReference(player, "Veja este lance")
  };

  assert.equal(getSharedPostCaption(baseMessage), "Veja este lance");
  assert.equal(
    getSharedPostCaption({
      ...baseMessage,
      body: "Mensagem recuperada pelo corpo",
      sharedPost: createSharedPostReference(player)
    }),
    "Mensagem recuperada pelo corpo"
  );
  assert.equal(
    getSharedPostCaption({
      ...baseMessage,
      sharedPost: createSharedPostReference(player)
    }),
    ""
  );
});

test("conta apenas mensagens que compartilham uma publicacao", () => {
  const sharedMessage: DirectMessage = {
    body: "Compartilhou uma publicação",
    createdAt: "2026-07-24T00:00:00.000Z",
    id: "message-share-a",
    recipientUserId: "user-b",
    senderUserId: "user-a",
    sharedPost: createSharedPostReference(player)
  };

  assert.deepEqual(
    countSharedPostsByPlayer([
      sharedMessage,
      { ...sharedMessage, id: "message-share-b" },
      {
        body: "Mensagem comum",
        createdAt: "2026-07-24T00:01:00.000Z",
        id: "message-plain",
        recipientUserId: "user-b",
        senderUserId: "user-a"
      }
    ]),
    { [player.id]: 2 }
  );
});


test("une conversas e perfis seguidos sem duplicar ou incluir a propria conta", () => {
  const contacts = selectShareContacts({
    contacts: [
      {
        id: "user-c",
        name: "Jogador C",
        profileId: "profile-user-c",
        subtitle: "Goleiro"
      },
      {
        id: user.id,
        name: user.name,
        profileId: `profile-${user.id}`,
        subtitle: "Sua conta"
      }
    ],
    currentUserId: user.id,
    followingProfileIds: [player.profileId, "profile-user-c"],
    players: [player],
    users: [user]
  });

  assert.deepEqual(
    contacts.map((contact) => contact.id),
    ["user-c", "user-b"]
  );
});
