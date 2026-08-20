import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseFunctions,
  getR2PublicMediaUrl
} from "../config/firebase";
import type { PublicationMediaInput, VideoSubmission } from "../types";
import { MAX_POST_TAGS, normalizeTagList } from "../utils/tagCatalog";
import {
  getPublicationMediaValidationMessage,
  normalizeMediaMimeType
} from "../utils/publicationMedia";
import { getCurrentFirebaseUser } from "./firebaseAccountService";

export class R2MediaUnavailableError extends Error {
  constructor(message = "O armazenamento de mídia não respondeu. Tente novamente.") {
    super(message);
    this.name = "R2MediaUnavailableError";
  }
}

type CreateUploadResponse = {
  contentType: string;
  expiresAt: string;
  uploadId: string;
  uploadUrl: string;
};

type FinalizeUploadResponse = {
  mediaKey: string;
  mediaURL: string;
  postId: string;
};

async function readMediaBlob(media: PublicationMediaInput) {
  if (media.file) {
    return media.file;
  }

  const response = await fetch(media.uri);
  if (!response.ok) {
    throw new R2MediaUnavailableError(
      "Não foi possível ler a mídia selecionada. Escolha o arquivo novamente."
    );
  }
  return response.blob();
}

function getUploadFailureMessage(status: number, responseBody = "") {
  const errorCode =
    responseBody.match(/<Code>([^<]+)<\/Code>/i)?.[1]?.trim() ?? "";

  if (status === 401 || status === 403) {
    return "O armazenamento recusou a autorização do envio. Tente novamente em alguns instantes.";
  }
  if (
    status === 400 &&
    ["AuthorizationHeaderMalformed", "InvalidArgument", "SignatureDoesNotMatch"].includes(
      errorCode
    )
  ) {
    return "A autorização temporária do envio é inválida. Tente publicar novamente.";
  }
  if (status === 413) {
    return "O arquivo excede o tamanho permitido pelo armazenamento.";
  }
  return "O armazenamento recusou o arquivo enviado. Tente novamente.";
}

export async function uploadWithProgress(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (progress: number) => void
) {
  if (typeof XMLHttpRequest === "undefined") {
    const response = await fetch(uploadUrl, {
      body: blob,
      headers: { "Content-Type": contentType },
      method: "PUT"
    });
    if (!response.ok) {
      throw new R2MediaUnavailableError(
        getUploadFailureMessage(response.status, await response.text())
      );
    }
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.timeout = 15 * 60 * 1000;
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    request.onabort = () =>
      reject(new R2MediaUnavailableError("O envio foi cancelado."));
    request.onerror = () =>
      reject(
        new R2MediaUnavailableError(
          "A conexão com o armazenamento falhou. Verifique sua internet e tente novamente."
        )
      );
    request.ontimeout = () =>
      reject(
        new R2MediaUnavailableError(
          "O envio demorou mais que o esperado. Tente novamente em uma conexão estável."
        )
      );
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(
        new R2MediaUnavailableError(
          getUploadFailureMessage(request.status, request.responseText)
        )
      );
    };
    request.send(blob);
  });
}

export function getR2MediaUrl(mediaKey: string) {
  const encodedKey = mediaKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${getR2PublicMediaUrl()}/${encodedKey}`;
}

export async function publishR2Post(
  submission: VideoSubmission,
  media: PublicationMediaInput,
  onProgress?: (progress: number) => void
) {
  const user = getCurrentFirebaseUser();
  if (!user || !user.emailVerified || user.uid !== submission.userId) {
    throw new R2MediaUnavailableError(
      "Sua sessão não tem permissão para publicar esta mídia."
    );
  }

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
    throw new R2MediaUnavailableError(validationMessage);
  }

  onProgress?.(0.03);
  const createUpload = httpsCallable<
    {
      fileName: string;
      fileSize: number;
      mediaType: "image" | "video";
      mimeType: string;
      postId: string;
    },
    CreateUploadResponse
  >(getFirebaseFunctions(), "createMediaUpload");
  const created = await createUpload({
    fileName: media.fileName,
    fileSize: blob.size,
    mediaType: media.mediaType,
    mimeType,
    postId: submission.id
  });

  await uploadWithProgress(
    created.data.uploadUrl,
    blob,
    created.data.contentType,
    (progress) => onProgress?.(0.05 + progress * 0.83)
  );
  onProgress?.(0.9);

  const finalizeUpload = httpsCallable<
    {
      description: string;
      durationMs: number;
      height: number;
      mentions: string[];
      tags: string[];
      title: string;
      uploadId: string;
      width: number;
    },
    FinalizeUploadResponse
  >(getFirebaseFunctions(), "finalizeMediaUpload");
  const finalized = await finalizeUpload({
    description: submission.highlight,
    durationMs: media.mediaType === "video" ? Math.round(media.durationMs ?? 0) : 0,
    height: Math.max(0, Math.round(media.height ?? 0)),
    mentions: submission.mentions ?? [],
    tags: normalizeTagList(submission.tags ?? [], MAX_POST_TAGS),
    title: submission.videoTitle,
    uploadId: created.data.uploadId,
    width: Math.max(0, Math.round(media.width ?? 0))
  });

  const now = new Date().toISOString();
  onProgress?.(1);
  return {
    ...submission,
    approvedAt: now,
    mediaHeight: media.height,
    mediaType: media.mediaType,
    mediaWidth: media.width,
    mimeType,
    status: "Aprovado" as const,
    storagePath: finalized.data.mediaKey,
    submittedAt: now,
    videoFileSize: blob.size,
    videoLink: finalized.data.mediaURL,
    videoDurationMs: media.durationMs,
    videoFileName: media.fileName
  };
}

export async function deleteR2Post(submission: VideoSubmission) {
  const removePost = httpsCallable<
    { postId: string },
    { deleted: boolean }
  >(getFirebaseFunctions(), "deleteR2Post");
  const result = await removePost({ postId: submission.id });
  return result.data.deleted;
}

export function isR2StoredPost(submission: VideoSubmission) {
  return Boolean(
    submission.storagePath?.startsWith(
      `users/${submission.userId}/posts/${submission.id}/`
    )
  );
}

export function getSafeR2PostMessage(error: unknown) {
  if (error instanceof R2MediaUnavailableError) {
    return error.message;
  }
  if (error instanceof FirebaseError && error.message.trim()) {
    return error.message.replace(/^Firebase:\s*/i, "");
  }
  return "Não foi possível publicar a mídia no R2. Tente novamente.";
}
