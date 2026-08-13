import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "../config/firebase";
import type { ProfileAvatar } from "../types";
import { getCurrentFirebaseUser } from "./firebaseAccountService";
import {
  R2MediaUnavailableError,
  uploadWithProgress
} from "./r2PostService";

const MAX_AVATAR_SIZE = 15 * 1024 * 1024;
const allowedAvatarMimeTypes = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

type CreateAvatarUploadResponse = {
  contentType: string;
  expiresAt: string;
  uploadId: string;
  uploadUrl: string;
};

type FinalizeAvatarUploadResponse = {
  avatarURL: string;
  cropScale: number;
  focusX: number;
  focusY: number;
  mediaKey: string;
  sourceHeight: number;
  sourceWidth: number;
};

export async function saveR2Avatar(uid: string, avatar: ProfileAvatar) {
  const user = getCurrentFirebaseUser();
  if (!user || !user.emailVerified || user.uid !== uid) {
    throw new R2MediaUnavailableError(
      "Sua sessão não pode alterar esta foto de perfil."
    );
  }

  const response = await fetch(avatar.uri);
  if (!response.ok) {
    throw new R2MediaUnavailableError("Não foi possível ler a foto escolhida.");
  }

  const blob = await response.blob();
  const mimeType = (blob.type || "image/jpeg").trim().toLowerCase();
  if (!allowedAvatarMimeTypes.has(mimeType)) {
    throw new R2MediaUnavailableError(
      "Use uma foto JPEG, PNG, WebP, HEIC ou HEIF."
    );
  }
  if (blob.size <= 0 || blob.size > MAX_AVATAR_SIZE) {
    throw new R2MediaUnavailableError(
      "A foto do perfil deve ter entre 1 byte e 15 MB."
    );
  }

  const createUpload = httpsCallable<
    { fileSize: number; mimeType: string },
    CreateAvatarUploadResponse
  >(getFirebaseFunctions(), "createAvatarUpload");
  const created = await createUpload({ fileSize: blob.size, mimeType });

  await uploadWithProgress(
    created.data.uploadUrl,
    blob,
    created.data.contentType
  );

  const finalizeUpload = httpsCallable<
    {
      cropScale: number;
      focusX: number;
      focusY: number;
      sourceHeight: number;
      sourceWidth: number;
      uploadId: string;
    },
    FinalizeAvatarUploadResponse
  >(getFirebaseFunctions(), "finalizeAvatarUpload");
  const finalized = await finalizeUpload({
    cropScale: Math.min(Math.max(avatar.cropScale, 0.3), 1),
    focusX: Math.min(Math.max(avatar.focusX, 0), 100),
    focusY: Math.min(Math.max(avatar.focusY, 0), 100),
    sourceHeight: Math.max(1, Math.round(avatar.sourceHeight ?? 1)),
    sourceWidth: Math.max(1, Math.round(avatar.sourceWidth ?? 1)),
    uploadId: created.data.uploadId
  });

  return {
    cropScale: finalized.data.cropScale,
    focusX: finalized.data.focusX,
    focusY: finalized.data.focusY,
    sourceHeight: finalized.data.sourceHeight,
    sourceWidth: finalized.data.sourceWidth,
    uri: finalized.data.avatarURL
  } satisfies ProfileAvatar;
}

export function getSafeR2AvatarMessage(error: unknown) {
  if (error instanceof R2MediaUnavailableError) {
    return error.message;
  }
  if (error instanceof FirebaseError && error.message.trim()) {
    return error.message.replace(/^Firebase:\s*/i, "");
  }
  return "Não foi possível salvar a foto no seu perfil. Tente novamente.";
}
