import { FirebaseError } from "firebase/app";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseFirestore,
  getFirebaseFunctions
} from "../config/firebase";
import type {
  ProfessionalSubscription,
  ProfessionalSubscriptionStatus
} from "../types";

type CheckoutResponse = {
  checkoutUrl: string | null;
  status: ProfessionalSubscriptionStatus;
};

function readIsoDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return typeof value === "string" ? value : "";
}

function readStatus(value: unknown): ProfessionalSubscriptionStatus | null {
  return value === "authorized" ||
    value === "canceled" ||
    value === "paused" ||
    value === "pending"
    ? value
    : value === "cancelled"
      ? "canceled"
      : null;
}

function readSubscription(
  uid: string,
  data: Record<string, unknown>
): ProfessionalSubscription | null {
  const status = readStatus(data.status);
  if (
    data.ownerUid !== uid ||
    data.plan !== "pro" ||
    data.provider !== "mercado_pago" ||
    data.currency !== "BRL" ||
    typeof data.amount !== "number" ||
    !status
  ) {
    return null;
  }

  return {
    amount: data.amount,
    authorizedAt: readIsoDate(data.authorizedAt) || undefined,
    canceledAt: readIsoDate(data.canceledAt) || undefined,
    checkoutUrl:
      typeof data.checkoutUrl === "string" ? data.checkoutUrl : undefined,
    currency: "BRL",
    nextPaymentAt: readIsoDate(data.nextPaymentAt) || undefined,
    plan: "pro",
    provider: "mercado_pago",
    status,
    updatedAt: readIsoDate(data.updatedAt)
  };
}

function toFriendlyError(
  error: unknown,
  fallback = "Não foi possível iniciar a assinatura agora."
) {
  if (error instanceof FirebaseError) {
    if (error.code === "functions/failed-precondition") {
      return (
        error.message ||
        "Confirme seu e-mail e complete o perfil antes de assinar."
      );
    }
    if (error.code === "functions/unavailable") {
      return "O Mercado Pago está temporariamente indisponível. Tente novamente.";
    }
  }

  return fallback;
}

export function subscribeToProfessionalSubscription(
  uid: string,
  onChange: (subscription: ProfessionalSubscription | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(getFirebaseFirestore(), "subscriptions", uid),
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? readSubscription(
              uid,
              snapshot.data() as Record<string, unknown>
            )
          : null
      );
    },
    (error) => onError?.(error)
  );
}

export async function createPlusSubscriptionCheckout() {
  const callable = httpsCallable<Record<string, never>, CheckoutResponse>(
    getFirebaseFunctions(),
    "createPlusSubscription"
  );

  try {
    return (await callable({})).data;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function syncProfessionalSubscription() {
  const callable = httpsCallable<
    Record<string, never>,
    { status: ProfessionalSubscriptionStatus; synced: boolean }
  >(getFirebaseFunctions(), "syncPlusSubscription");

  try {
    return (await callable({})).data;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function syncProfessionalSubscriptionWithRetry(
  options: { attempts?: number; delayMs?: number } = {}
) {
  const attempts = Math.max(1, options.attempts ?? 4);
  const delayMs = Math.max(0, options.delayMs ?? 1200);
  let latest = await syncProfessionalSubscription();

  for (let attempt = 1; attempt < attempts && latest.status === "pending"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    latest = await syncProfessionalSubscription();
  }

  return latest;
}

export async function cancelProfessionalSubscription() {
  const callable = httpsCallable<
    Record<string, never>,
    { status: ProfessionalSubscriptionStatus }
  >(getFirebaseFunctions(), "cancelPlusSubscription");

  try {
    return (await callable({})).data;
  } catch (error) {
    throw new Error(
      toFriendlyError(
        error,
        "Não foi possível cancelar a assinatura agora."
      )
    );
  }
}
