import { defineSecret } from "firebase-functions/params";

export const REGION = "southamerica-east1";
export const R2_ACCOUNT_ID = "8079ed2b188af004a83d0434f03c6817";
export const R2_UPLOADS_BUCKET = "xolot-uploads";
export const R2_MEDIA_BUCKET = "xolot-media";
export const R2_PUBLIC_BASE_URL = "https://media.xolot.com.br";
export const UPLOAD_URL_TTL_SECONDS = 15 * 60;
export const UPLOAD_INTENT_TTL_SECONDS = 30 * 60;
export const MAX_UPLOAD_INTENTS_PER_MINUTE = 10;

export const r2AccessKeyId = defineSecret("R2_ACCESS_KEY_ID");
export const r2SecretAccessKey = defineSecret("R2_SECRET_ACCESS_KEY");
export const mercadoPagoAccessToken = defineSecret("MERCADO_PAGO_ACCESS_TOKEN");
export const mercadoPagoWebhookSecret = defineSecret("MERCADO_PAGO_WEBHOOK_SECRET");
