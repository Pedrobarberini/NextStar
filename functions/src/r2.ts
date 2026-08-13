import { S3Client } from "@aws-sdk/client-s3";
import {
  R2_ACCOUNT_ID,
  R2_PUBLIC_BASE_URL,
  r2AccessKeyId,
  r2SecretAccessKey
} from "./config";

export function createR2Client() {
  const accessKeyId = r2AccessKeyId.value().trim();
  const secretAccessKey = r2SecretAccessKey.value().trim();

  if (accessKeyId.length !== 32 || secretAccessKey.length !== 64) {
    throw new Error("As credenciais R2 possuem formato inválido.");
  }

  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: "auto"
  });
}

export function getPublicMediaUrl(mediaKey: string) {
  const encodedKey = mediaKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${R2_PUBLIC_BASE_URL}/${encodedKey}`;
}

export function getCopySource(bucket: string, objectKey: string) {
  const encodedKey = objectKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${bucket}/${encodedKey}`;
}
