import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable
} from "firebase/storage";
import {
  getFirebaseFirestore,
  getFirebaseStorage,
  isFirebaseStorageConfigured
} from "../config/firebase";
import { normalizeProfileAvatar } from "../repositories/profileAvatarSchema";
import type { ProfileAvatar, ProfileAvatarsByProfile } from "../types";
import { getCurrentFirebaseUser } from "./firebaseAccountService";

const PROFILE_MEDIA_COLLECTION = "profileMedia";
const MAX_PROFILE_MEDIA = 200;
const MAX_AVATAR_SIZE = 15 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function assertAvatarOwner(uid: string) {
  const user = getCurrentFirebaseUser();
  if (!user || !user.emailVerified || user.uid !== uid) {
    throw new Error("Sua sessão não pode alterar esta foto de perfil.");
  }
  if (!isFirebaseStorageConfigured()) {
    throw new Error("O armazenamento da foto ainda não está configurado.");
  }
}

function normalizeProfileMedia(uid: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (data.uid !== uid || typeof data.avatarURL !== "string") {
    return null;
  }

  return normalizeProfileAvatar({
    cropScale: data.cropScale,
    focusX: data.focusX,
    focusY: data.focusY,
    sourceHeight: data.sourceHeight,
    sourceWidth: data.sourceWidth,
    uri: data.avatarURL
  });
}

async function uploadAvatarBlob(uid: string, avatar: ProfileAvatar) {
  const response = await fetch(avatar.uri);
  if (!response.ok) {
    throw new Error("Não foi possível ler a foto escolhida.");
  }

  const blob = await response.blob();
  const mimeType = (blob.type || "image/jpeg").trim().toLowerCase();
  if (!ALLOWED_AVATAR_TYPES.has(mimeType)) {
    throw new Error("Use uma foto JPEG, PNG, WebP, HEIC ou HEIF.");
  }
  if (blob.size <= 0 || blob.size > MAX_AVATAR_SIZE) {
    throw new Error("A foto do perfil deve ter entre 1 byte e 15 MB.");
  }

  const avatarPath = `avatars/${uid}/profile`;
  const avatarReference = ref(getFirebaseStorage(), avatarPath);
  const uploadTask = uploadBytesResumable(avatarReference, blob, {
    cacheControl: "no-cache,max-age=0,must-revalidate",
    contentType: mimeType,
    customMetadata: { ownerUid: uid }
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on("state_changed", undefined, reject, () => resolve());
  });

  return {
    avatarPath,
    avatarURL: await getDownloadURL(avatarReference)
  };
}

export async function saveFirebaseAvatar(uid: string, avatar: ProfileAvatar) {
  assertAvatarOwner(uid);
  const firestore = getFirebaseFirestore();
  const profileMediaReference = doc(firestore, PROFILE_MEDIA_COLLECTION, uid);
  const existingSnapshot = await getDoc(profileMediaReference);
  const existingData = existingSnapshot.data();
  const existingURL =
    typeof existingData?.avatarURL === "string" ? existingData.avatarURL : "";
  const existingPath =
    typeof existingData?.avatarPath === "string" ? existingData.avatarPath : "";
  const uploaded =
    existingURL && avatar.uri === existingURL
      ? { avatarPath: existingPath, avatarURL: existingURL }
      : await uploadAvatarBlob(uid, avatar);
  const normalizedAvatar = {
    cropScale: Math.min(Math.max(avatar.cropScale, 0.3), 1),
    focusX: Math.min(Math.max(avatar.focusX, 0), 100),
    focusY: Math.min(Math.max(avatar.focusY, 0), 100),
    sourceHeight: Math.max(1, Math.round(avatar.sourceHeight ?? 1)),
    sourceWidth: Math.max(1, Math.round(avatar.sourceWidth ?? 1)),
    uri: uploaded.avatarURL
  };

  await setDoc(profileMediaReference, {
    avatarPath: uploaded.avatarPath,
    avatarURL: uploaded.avatarURL,
    createdAt: existingSnapshot.exists()
      ? existingData?.createdAt
      : serverTimestamp(),
    cropScale: normalizedAvatar.cropScale,
    focusX: normalizedAvatar.focusX,
    focusY: normalizedAvatar.focusY,
    sourceHeight: normalizedAvatar.sourceHeight,
    sourceWidth: normalizedAvatar.sourceWidth,
    uid,
    updatedAt: serverTimestamp()
  });

  return normalizedAvatar;
}

export function subscribeFirebaseProfileMedia(
  onChange: (avatars: ProfileAvatarsByProfile) => void,
  onError?: (error: Error) => void
) {
  const mediaQuery = query(
    collection(getFirebaseFirestore(), PROFILE_MEDIA_COLLECTION),
    orderBy("updatedAt", "desc"),
    limit(MAX_PROFILE_MEDIA)
  );

  return onSnapshot(
    mediaQuery,
    (snapshot) => {
      const avatars = Object.fromEntries(
        snapshot.docs.flatMap((mediaDocument) => {
          const avatar = normalizeProfileMedia(
            mediaDocument.id,
            mediaDocument.data()
          );
          return avatar
            ? [[`profile-${mediaDocument.id}`, avatar] as const]
            : [];
        })
      );
      onChange(avatars);
    },
    (error) => onError?.(error)
  );
}

export function getSafeFirebaseAvatarMessage(error: unknown) {
  if (error instanceof Error && !(error instanceof FirebaseError)) {
    return error.message;
  }
  if (error instanceof FirebaseError && error.code === "storage/unauthorized") {
    return "Sua sessão não tem permissão para alterar esta foto.";
  }
  return "Não foi possível salvar a foto no seu perfil. Tente novamente.";
}
