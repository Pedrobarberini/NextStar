import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  PreApproval,
  WebhookSignatureValidator
} from "mercadopago";
import { randomUUID } from "node:crypto";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { requireVerifiedUser, verifyRegisteredUser } from "./auth";
import {
  REGION,
  mercadoPagoAccessToken,
  mercadoPagoWebhookSecret
} from "./config";

const PLUS_AMOUNT = 19.9;
const PLUS_CURRENCY = "BRL";
const PLUS_REASON = "Xolot Plus";
const CHECKOUT_RETURN_URL = "https://xolot.com.br/?subscription=return";
const WEBHOOK_URL =
  "https://southamerica-east1-xolot-384e9.cloudfunctions.net/mercadoPagoWebhook?source_news=webhooks";

type SubscriptionStatus = "authorized" | "cancelled" | "paused" | "pending";

type MercadoPagoSubscription = {
  auto_recurring?: {
    currency_id?: string;
    transaction_amount?: number;
  };
  external_reference?: string;
  id?: string;
  init_point?: string;
  next_payment_date?: string;
  status?: string;
};

function getClient() {
  return new PreApproval(
    new MercadoPagoConfig({
      accessToken: mercadoPagoAccessToken.value(),
      options: { timeout: 10_000 }
    })
  );
}

function normalizeStatus(status: string | undefined): SubscriptionStatus {
  if (status === "authorized" || status === "paused" || status === "cancelled") {
    return status;
  }

  return "pending";
}

function getUidFromExternalReference(reference: string | undefined) {
  if (!reference?.startsWith("xolot_plus:")) {
    return null;
  }

  const [, uid] = reference.split(":");
  return uid || null;
}

function assertExpectedSubscription(subscription: MercadoPagoSubscription) {
  const amount = subscription.auto_recurring?.transaction_amount;
  const currency = subscription.auto_recurring?.currency_id;

  if (
    typeof amount !== "number" ||
    Math.abs(amount - PLUS_AMOUNT) > 0.001 ||
    currency !== PLUS_CURRENCY
  ) {
    throw new Error("A assinatura recebida não corresponde ao plano Xolot Plus.");
  }
}

async function saveSubscription(
  uid: string,
  subscription: MercadoPagoSubscription,
  checkoutAttemptId?: string
) {
  assertExpectedSubscription(subscription);

  if (!subscription.id) {
    throw new Error("O Mercado Pago não retornou o identificador da assinatura.");
  }

  const reference = getFirestore().doc(`subscriptions/${uid}`);
  const snapshot = await reference.get();
  const payload: Record<string, unknown> = {
    amount: PLUS_AMOUNT,
    checkoutUrl: subscription.init_point ?? null,
    currency: PLUS_CURRENCY,
    nextPaymentAt: subscription.next_payment_date ?? null,
    ownerUid: uid,
    plan: "pro",
    provider: "mercado_pago",
    providerSubscriptionId: subscription.id,
    status: normalizeStatus(subscription.status),
    updatedAt: FieldValue.serverTimestamp()
  };

  if (!snapshot.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }
  if (checkoutAttemptId) {
    payload.checkoutAttemptId = checkoutAttemptId;
  }

  await reference.set(payload, { merge: true });
  return normalizeStatus(subscription.status);
}

async function loadProviderSubscription(subscriptionId: string) {
  return (await getClient().get({ id: subscriptionId })) as MercadoPagoSubscription;
}

const callableOptions = {
  region: REGION,
  secrets: [mercadoPagoAccessToken]
};

export const createPlusSubscription = onCall(callableOptions, async (request) => {
  const uid = requireVerifiedUser(request);
  await verifyRegisteredUser(uid);

  const payerEmail =
    typeof request.auth?.token.email === "string"
      ? request.auth.token.email.trim().toLowerCase()
      : "";

  if (!payerEmail) {
    throw new HttpsError(
      "failed-precondition",
      "Sua conta precisa ter um e-mail válido para assinar o Xolot Plus."
    );
  }

  const reference = getFirestore().doc(`subscriptions/${uid}`);
  const existing = await reference.get();
  const existingData = existing.data();

  if (existingData?.status === "authorized") {
    return { checkoutUrl: null, status: "authorized" as const };
  }

  if (
    existingData?.status === "pending" &&
    typeof existingData.checkoutUrl === "string" &&
    existingData.checkoutUrl.startsWith("https://")
  ) {
    return {
      checkoutUrl: existingData.checkoutUrl,
      status: "pending" as const
    };
  }

  const checkoutAttemptId = randomUUID();
  const externalReference = `xolot_plus:${uid}:${checkoutAttemptId}`;
  const body = {
    auto_recurring: {
      currency_id: PLUS_CURRENCY,
      frequency: 1,
      frequency_type: "months",
      transaction_amount: PLUS_AMOUNT
    },
    back_url: CHECKOUT_RETURN_URL,
    external_reference: externalReference,
    notification_url: WEBHOOK_URL,
    payer_email: payerEmail,
    reason: PLUS_REASON,
    status: "pending"
  };

  try {
    const subscription = (await getClient().create({
      body,
      requestOptions: { idempotencyKey: checkoutAttemptId }
    })) as MercadoPagoSubscription;

    const status = await saveSubscription(
      uid,
      subscription,
      checkoutAttemptId
    );

    if (!subscription.init_point) {
      throw new Error("O Mercado Pago não retornou o link de pagamento.");
    }

    return {
      checkoutUrl: subscription.init_point,
      status
    };
  } catch (error) {
    console.error("Falha ao criar assinatura Xolot Plus.", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      uid
    });
    throw new HttpsError(
      "unavailable",
      "Não foi possível abrir o pagamento agora. Tente novamente em instantes."
    );
  }
});

export const syncPlusSubscription = onCall(callableOptions, async (request) => {
  const uid = requireVerifiedUser(request);
  await verifyRegisteredUser(uid);

  const reference = getFirestore().doc(`subscriptions/${uid}`);
  const snapshot = await reference.get();
  const subscriptionId = snapshot.data()?.providerSubscriptionId;

  if (typeof subscriptionId !== "string" || !subscriptionId) {
    return { status: "pending" as const, synced: false };
  }

  try {
    const subscription = await loadProviderSubscription(subscriptionId);
    const externalUid = getUidFromExternalReference(
      subscription.external_reference
    );

    if (externalUid !== uid) {
      throw new Error("A assinatura não pertence à conta conectada.");
    }

    const status = await saveSubscription(uid, subscription);
    return { status, synced: true };
  } catch (error) {
    console.error("Falha ao sincronizar assinatura Xolot Plus.", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      uid
    });
    throw new HttpsError(
      "unavailable",
      "Não foi possível atualizar a assinatura agora."
    );
  }
});

export const mercadoPagoWebhook = onRequest(
  {
    cors: false,
    invoker: "public",
    region: REGION,
    secrets: [mercadoPagoAccessToken, mercadoPagoWebhookSecret]
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const bodyDataId = request.body?.data?.id;
    const queryDataId = request.query["data.id"] ?? request.query.data_id;
    const dataId =
      typeof queryDataId === "string"
        ? queryDataId
        : Array.isArray(queryDataId) && typeof queryDataId[0] === "string"
          ? queryDataId[0]
          : typeof bodyDataId === "string" || typeof bodyDataId === "number"
            ? String(bodyDataId)
            : undefined;

    try {
      WebhookSignatureValidator.validate({
        dataId,
        secret: mercadoPagoWebhookSecret.value(),
        xRequestId: request.headers["x-request-id"],
        xSignature: request.headers["x-signature"]
      });
    } catch (error) {
      console.warn("Webhook Mercado Pago rejeitado.", {
        reason:
          error instanceof InvalidWebhookSignatureError
            ? error.reason
            : "validation_error"
      });
      response.status(401).send("Invalid signature");
      return;
    }

    const eventType =
      typeof request.body?.type === "string" ? request.body.type : "";

    if (eventType !== "subscription_preapproval" || typeof dataId !== "string") {
      response.status(200).send("Ignored");
      return;
    }

    try {
      const subscription = await loadProviderSubscription(dataId);
      const uid = getUidFromExternalReference(subscription.external_reference);

      if (!uid) {
        response.status(200).send("Unknown subscription");
        return;
      }

      await saveSubscription(uid, subscription);
      response.status(200).send("OK");
    } catch (error) {
      console.error("Falha ao processar webhook Mercado Pago.", {
        dataId,
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
      response.status(500).send("Retry");
    }
  }
);
