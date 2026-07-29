import { FirebaseError } from "firebase/app";
import {
  collection,
  deleteDoc,
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
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot
} from "firebase/storage";
import {
  getFirebaseFirestore,
  getFirebaseStorage,
  isFirebaseStorageConfigured
} from "../config/firebase";
import type {
  PublicationMediaInput,
  VideoSubmission
} from "../types";
import {
  firebasePostToSubmission,
  normalizeFirebasePostDocument
} from "../utils/firebasePostDocument";
import {
  getPublicationMediaValidationMessage,
  normalizeMediaMimeType
} from "../utils/publicationMedia";
import { getCurrentFirebaseUser } from "./firebaseAccountService";

const POSTS_COLLECTION = "posts";
const MAX_FEED_POSTS = 50;

export class FirebaseMediaUnavailableError extends Error {
  constructor() {
    super(
      "O armazenamento de mídia ainda não está disponível. Verifique o Firebase Storage."
    );
    this.name = "FirebaseMediaUnavailableError";
  }
}

export class InvalidPublicationMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPublicationMediaError";
  }
}

export class PublicationPermissionError extends Error {
  constructor() {
    super("Sua sessão não tem permissão para alterar esta publicação.");
    this.name = "PublicationPermissionError";
  }
}

function assertPublishingUser(ownerUserId: string) {
  const user = getCurrentFirebaseUser();

  if (!user || !user.emailVerified || user.uid !== ownerUserId) {
    throw new PublicationPermissionError();
  }

  if (!isFirebaseStorageConfigured()) {
    throw new FirebaseMediaUnavailableError();
  }

  return user;
}

async function readMediaBlob(media: PublicationMediaInput) {
  if (media.file) {
    return media.file;
  }

  const response = await fetch(media.uri);
  if (!response.ok) {
    throw new InvalidPublicationMediaError(
      "Não foi possível ler a mídia selecionada. Escolha o arquivo novamente."
    );
  }

  return response.blob();
}

function waitForUpload(
  task: ReturnType<typeof uploadBytesResumable>,
  onProgress?: (progress: number) => void
) {
  return new Promise<UploadTaskSnapshot>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const progress =
          snapshot.totalBytes > 0
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0;
        onProgress?.(Math.min(Math.max(progress, 0), 1));
      },
      reject,
      () => resolve(task.snapshot)
    );
  });
}

export async function publishFirebasePost(
  submission: VideoSubmission,
  media: PublicationMediaInput,
  onProgress?: (progress: number) => void
) {
  const user = assertPublishingUser(submission.userId);
  const blob = await readMediaBlob(media);
  const mimeType = normalizeMediaMimeType(
    media.mediaType,
    media.mimeType || blob.type
  );
  const validationMessage = getPublicationMediaValidationMessage(
    media,
    blob.size,
    mimeType
  );

  if (validationMessage) {
    throw new InvalidPublicationMediaError(validationMessage);
  }

  const postId = submission.id.trim();
  if (!postId || postId.length > 128) {
    throw new InvalidPublicationMediaError(
      "Não foi possível gerar um identificador seguro para a publicação."
    );
  }

  const mediaPath = `posts/${user.uid}/${postId}/media`;
  const mediaReference = ref(getFirebaseStorage(), mediaPath);
  const postReference = doc(getFirebaseFirestore(), POSTS_COLLECTION, postId);
  const uploadTask = uploadBytesResumable(mediaReference, blob, {
    cacheControl: "public,max-age=31536000,immutable",
    contentType: mimeType,
    customMetadata: {
      mediaType: media.mediaType,
      ownerUid: user.uid,
      postId
    }
  });

  await waitForUpload(uploadTask, onProgress);

  let mediaURL = "";
  try {
    mediaURL = await getDownloadURL(mediaReference);
    await setDoc(postReference, {
      authorId: user.uid,
      createdAt: serverTimestamp(),
      description: submission.highlight.trim(),
      durationMs:
        media.mediaType === "video"
          ? Math.max(0, Math.round(media.durationMs ?? 0))
          : 0,
      fileName: media.fileName.trim().slice(0, 160) || "media",
      fileSize: blob.size,
      height: Math.max(0, Math.round(media.height ?? 0)),
      mediaPath,
      mediaType: media.mediaType,
      mentions: (submission.mentions ?? []).slice(0, 10),
      mimeType,
      status: "published",
      tags: (submission.tags ?? []).slice(0, 10),
      title: submission.videoTitle.trim(),
      updatedAt: serverTimestamp(),
      width: Math.max(0, Math.round(media.width ?? 0))
    });
  } catch (error) {
    await deleteObject(mediaReference).catch(() => undefined);
    throw error;
  }

  const now = new Date().toISOString();

  return {
    ...submission,
    approvedAt: now,
    mediaHeight: media.height,
    mediaType: media.mediaType,
    mediaWidth: media.width,
    mimeType,
    status: "Aprovado" as const,
    storagePath: mediaPath,
    submittedAt: now,
    videoFileSize: blob.size,
    videoLink: mediaURL
  };
}

export function subscribeFirebasePosts(
  onPosts: (posts: VideoSubmission[]) => void,
  onError?: (error: Error) => void
) {
  const postsQuery = query(
    collection(getFirebaseFirestore(), POSTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(MAX_FEED_POSTS)
  );
  let deliveryGeneration = 0;

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const currentGeneration = ++deliveryGeneration;

      Promise.all(
        snapshot.docs.map(async (postSnapshot) => {
          const post = normalizeFirebasePostDocument(
            postSnapshot.id,
            postSnapshot.data()
          );
          if (!post) {
            return null;
          }

          try {
            const mediaURL = await getDownloadURL(
              ref(getFirebaseStorage(), post.mediaPath)
            );
            return firebasePostToSubmission(
              postSnapshot.id,
              post,
              mediaURL
            );
          } catch {
            return null;
          }
        })
      )
        .then((posts) => {
          if (currentGeneration === deliveryGeneration) {
            onPosts(
              posts.filter((post): post is VideoSubmission => Boolean(post))
            );
          }
        })
        .catch((error: Error) => onError?.(error));
    },
    (error) => onError?.(error)
  );
}

export async function deleteFirebasePost(submission: VideoSubmission) {
  const user = assertPublishingUser(submission.userId);
  const postReference = doc(
    getFirebaseFirestore(),
    POSTS_COLLECTION,
    submission.id
  );
  const snapshot = await getDoc(postReference);

  if (!snapshot.exists() || snapshot.data().authorId !== user.uid) {
    throw new PublicationPermissionError();
  }

  const mediaPath =
    typeof snapshot.data().mediaPath === "string"
      ? snapshot.data().mediaPath
      : submission.storagePath;

  if (mediaPath) {
    try {
      await deleteObject(ref(getFirebaseStorage(), mediaPath));
    } catch (error) {
      if (!(error instanceof FirebaseError) || error.code !== "storage/object-not-found") {
        throw error;
      }
    }
  }

  await deleteDoc(postReference);
  return true;
}

export function isFirebaseStoredPost(submission: VideoSubmission) {
  return Boolean(
    submission.storagePath?.startsWith(`posts/${submission.userId}/`)
  );
}

export function getSafeFirebasePostMessage(error: unknown) {
  if (
    error instanceof FirebaseMediaUnavailableError ||
    error instanceof InvalidPublicationMediaError ||
    error instanceof PublicationPermissionError
  ) {
    return error.message;
  }

  if (!(error instanceof FirebaseError)) {
    return "Não foi possível publicar a mídia. Tente novamente.";
  }

  if (error.code === "storage/unauthorized" || error.code === "permission-denied") {
    return "Sua sessão não tem permissão para publicar. Entre novamente e confirme seu email.";
  }

  if (error.code === "storage/quota-exceeded") {
    return "O limite de armazenamento foi atingido. Tente novamente mais tarde.";
  }

  if (
    error.code === "storage/retry-limit-exceeded" ||
    error.code === "storage/unknown" ||
    error.code === "unavailable"
  ) {
    return "A conexão com o armazenamento falhou. Verifique sua internet e tente novamente.";
  }

  return "Não foi possível publicar a mídia com segurança. Tente novamente.";
}
