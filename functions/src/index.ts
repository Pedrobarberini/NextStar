import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { requireVerifiedUser, verifyRegisteredUser } from "./auth";
import {
  MAX_UPLOAD_INTENTS_PER_MINUTE,
  REGION,
  R2_MEDIA_BUCKET,
  R2_UPLOADS_BUCKET,
  UPLOAD_INTENT_TTL_SECONDS,
  UPLOAD_URL_TTL_SECONDS,
  r2AccessKeyId,
  r2SecretAccessKey
} from "./config";
import { createR2Client, getCopySource, getPublicMediaUrl } from "./r2";
import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_DURATION_MS,
  MAX_VIDEO_SIZE,
  allowedMimeTypes,
  normalizeStringList,
  normalizeTagList,
  requireInteger,
  requireRecord,
  requireText
} from "./validation";

initializeApp();

const callableOptions = {
  region: REGION,
  secrets: [r2AccessKeyId, r2SecretAccessKey]
};

type UploadIntentData = {
  expectedSize: number;
  expiresAt: Timestamp;
  fileName: string;
  mediaKey: string;
  mediaType: "image" | "video";
  mimeType: string;
  ownerUid: string;
  postId: string;
  status: "pending" | "finalizing" | "completed";
  uploadKey: string;
};

async function applyUploadRateLimit(uid: string) {
  const database = getFirestore();
  const reference = database.doc(`mediaRateLimits/${uid}`);
  const now = Date.now();

  await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const data = snapshot.data();
    const previousWindow =
      typeof data?.windowStartedAtMs === "number" ? data.windowStartedAtMs : 0;
    const isCurrentWindow = now - previousWindow < 60_000;
    const count =
      isCurrentWindow && typeof data?.count === "number" ? data.count : 0;

    if (count >= MAX_UPLOAD_INTENTS_PER_MINUTE) {
      throw new HttpsError(
        "resource-exhausted",
        "Muitos envios em pouco tempo. Aguarde um minuto."
      );
    }

    transaction.set(reference, {
      count: count + 1,
      updatedAt: FieldValue.serverTimestamp(),
      windowStartedAtMs: isCurrentWindow ? previousWindow : now
    });
  });
}

export const createMediaUpload = onCall(callableOptions, async (request) => {
  const uid = requireVerifiedUser(request);
  await verifyRegisteredUser(uid);
  await applyUploadRateLimit(uid);

  const data = requireRecord(request.data);
  const postId = requireText(data.postId, "Identificador", 1, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(postId)) {
    throw new HttpsError(
      "invalid-argument",
      "Identificador da publicação inválido."
    );
  }

  const mimeType = requireText(data.mimeType, "Formato", 3, 100).toLowerCase();
  const mime = allowedMimeTypes.get(mimeType);
  const mediaType =
    data.mediaType === "image"
      ? "image"
      : data.mediaType === "video"
        ? "video"
        : null;
  if (!mime || !mediaType || mime.mediaType !== mediaType) {
    throw new HttpsError("invalid-argument", "Formato de mídia não permitido.");
  }

  const maximumSize = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const fileSize = requireInteger(data.fileSize, "Tamanho", 1, maximumSize);
  const fileName = requireText(data.fileName, "Nome do arquivo", 1, 160);
  const database = getFirestore();
  const existingPost = await database.doc(`posts/${postId}`).get();
  if (existingPost.exists) {
    throw new HttpsError("already-exists", "Esta publicação já existe.");
  }

  const uploadId = randomUUID();
  const objectId = randomUUID();
  const uploadKey = `pending/${uid}/${postId}/${objectId}.${mime.extension}`;
  const mediaKey = `users/${uid}/posts/${postId}/${objectId}.${mime.extension}`;
  const expiresAtMs = Date.now() + UPLOAD_INTENT_TTL_SECONDS * 1000;
  const intent: UploadIntentData = {
    expectedSize: fileSize,
    expiresAt: Timestamp.fromMillis(expiresAtMs),
    fileName,
    mediaKey,
    mediaType,
    mimeType,
    ownerUid: uid,
    postId,
    status: "pending",
    uploadKey
  };

  await database.doc(`mediaUploadIntents/${uploadId}`).set({
    ...intent,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  let uploadUrl = "";
  try {
    uploadUrl = await getSignedUrl(
      createR2Client(),
      new PutObjectCommand({
        Bucket: R2_UPLOADS_BUCKET,
        ContentType: mimeType,
        Key: uploadKey
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS }
    );
  } catch (error) {
    const failure =
      error instanceof Error
        ? { message: error.message, name: error.name }
        : { message: "Erro desconhecido", name: "UnknownError" };
    console.error("Falha ao assinar upload R2.", failure);
    throw new HttpsError(
      "failed-precondition",
      "O armazenamento de mídia ainda não está configurado corretamente."
    );
  }

  return {
    contentType: mimeType,
    expiresAt: new Date(expiresAtMs).toISOString(),
    uploadId,
    uploadUrl
  };
});

export const finalizeMediaUpload = onCall(callableOptions, async (request) => {
  const uid = requireVerifiedUser(request);
  await verifyRegisteredUser(uid);

  const data = requireRecord(request.data);
  const uploadId = requireText(data.uploadId, "Upload", 1, 80);
  const database = getFirestore();
  const intentReference = database.doc(`mediaUploadIntents/${uploadId}`);
  const intentSnapshot = await intentReference.get();

  if (!intentSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "O envio expirou. Selecione o arquivo novamente."
    );
  }

  const intent = intentSnapshot.data() as UploadIntentData;
  if (intent.ownerUid !== uid) {
    throw new HttpsError("permission-denied", "Este envio pertence a outra conta.");
  }
  if (intent.expiresAt.toMillis() < Date.now()) {
    throw new HttpsError("deadline-exceeded", "O envio expirou. Tente novamente.");
  }
  if (intent.status === "completed") {
    return {
      mediaKey: intent.mediaKey,
      mediaURL: getPublicMediaUrl(intent.mediaKey),
      postId: intent.postId
    };
  }

  const durationMs = requireInteger(
    data.durationMs,
    "Duração",
    0,
    intent.mediaType === "video" ? MAX_VIDEO_DURATION_MS : 0
  );
  const width = requireInteger(data.width, "Largura", 0, 10_000);
  const height = requireInteger(data.height, "Altura", 0, 10_000);
  const title = requireText(data.title, "Título", 4, 120);
  const description = requireText(data.description, "Descrição", 4, 2000);
  const tags = normalizeTagList(data.tags, 10);
  const mentions = normalizeStringList(data.mentions, 10, 30);
  const client = createR2Client();
  const uploaded = await client
    .send(
      new HeadObjectCommand({
        Bucket: R2_UPLOADS_BUCKET,
        Key: intent.uploadKey
      })
    )
    .catch(() => null);

  if (!uploaded) {
    throw new HttpsError("not-found", "O arquivo não chegou ao armazenamento.");
  }
  if (
    uploaded.ContentLength !== intent.expectedSize ||
    uploaded.ContentType !== intent.mimeType
  ) {
    await client
      .send(
        new DeleteObjectCommand({
          Bucket: R2_UPLOADS_BUCKET,
          Key: intent.uploadKey
        })
      )
      .catch(() => undefined);
    throw new HttpsError(
      "invalid-argument",
      "O arquivo enviado não corresponde ao arquivo autorizado."
    );
  }

  await intentReference.update({
    status: "finalizing",
    updatedAt: FieldValue.serverTimestamp()
  });

  await client.send(
    new CopyObjectCommand({
      Bucket: R2_MEDIA_BUCKET,
      CacheControl: "public,max-age=31536000,immutable",
      ContentType: intent.mimeType,
      CopySource: getCopySource(R2_UPLOADS_BUCKET, intent.uploadKey),
      Key: intent.mediaKey,
      MetadataDirective: "REPLACE"
    })
  );

  const postReference = database.doc(`posts/${intent.postId}`);
  await database.runTransaction(async (transaction) => {
    const post = await transaction.get(postReference);
    if (post.exists) {
      throw new HttpsError(
        "already-exists",
        "Esta publicação já foi finalizada."
      );
    }

    transaction.set(postReference, {
      authorId: uid,
      createdAt: FieldValue.serverTimestamp(),
      description,
      durationMs,
      fileName: intent.fileName,
      fileSize: intent.expectedSize,
      height,
      mediaKey: intent.mediaKey,
      mediaPath: intent.mediaKey,
      mediaType: intent.mediaType,
      mentions,
      mimeType: intent.mimeType,
      status: "published",
      storageProvider: "r2",
      tags,
      title,
      updatedAt: FieldValue.serverTimestamp(),
      width
    });
    transaction.update(intentReference, {
      completedAt: FieldValue.serverTimestamp(),
      status: "completed",
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  await client
    .send(
      new DeleteObjectCommand({
        Bucket: R2_UPLOADS_BUCKET,
        Key: intent.uploadKey
      })
    )
    .catch(() => undefined);

  return {
    mediaKey: intent.mediaKey,
    mediaURL: getPublicMediaUrl(intent.mediaKey),
    postId: intent.postId
  };
});

export const deleteR2Post = onCall(callableOptions, async (request) => {
  const uid = requireVerifiedUser(request);
  const data = requireRecord(request.data);
  const postId = requireText(data.postId, "Publicação", 1, 128);
  const database = getFirestore();
  const postReference = database.doc(`posts/${postId}`);
  const post = await postReference.get();
  const postData = post.data();

  if (!post.exists) {
    return { deleted: false };
  }
  if (postData?.authorId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "Esta publicação pertence a outra conta."
    );
  }
  if (postData?.storageProvider !== "r2" || typeof postData.mediaKey !== "string") {
    throw new HttpsError(
      "failed-precondition",
      "Esta publicação não usa o armazenamento R2."
    );
  }

  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_MEDIA_BUCKET,
      Key: postData.mediaKey
    })
  );

  if (typeof postData.thumbnailKey === "string") {
    await client
      .send(
        new DeleteObjectCommand({
          Bucket: R2_MEDIA_BUCKET,
          Key: postData.thumbnailKey
        })
      )
      .catch(() => undefined);
  }

  await postReference.delete();
  return { deleted: true };
});
export {
  createAvatarUpload,
  finalizeAvatarUpload,
  updateAvatarCrop
} from "./avatar";
export { finalizeAccountRegistration } from "./account";
export { recordPostView, sendDirectMessage, setPostLike } from "./social";
export { ensureTagCatalogEntry, syncPostTagCatalog } from "./tags";
export { updateDirectMessageReceipts } from "./messageReceipts";
export {
  markNotificationsRead,
  notifyDirectMessage,
  notifyPostComment,
  notifyPostLike
} from "./notifications";
export {
  cancelPlusSubscription,
  createPlusSubscription,
  mercadoPagoWebhook,
  syncPlusSubscription
} from "./mercadoPago";
