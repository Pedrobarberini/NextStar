import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "../config/firebase";
import type { IdentityVerification } from "../types";

function readIsoDate(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
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

function readVerification(data: Record<string, unknown>): IdentityVerification | null {
  const status = data.status;
  if (
    status !== "approved" &&
    status !== "expired" &&
    status !== "pending" &&
    status !== "rejected"
  ) {
    return null;
  }

  return {
    provider: typeof data.provider === "string" ? data.provider : undefined,
    reviewNote: typeof data.reviewNote === "string" ? data.reviewNote : undefined,
    status,
    submittedAt: readIsoDate(data.submittedAt) || undefined,
    updatedAt: readIsoDate(data.updatedAt)
  };
}

export function subscribeToIdentityVerification(
  uid: string,
  onChange: (verification: IdentityVerification | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(getFirebaseFirestore(), "identityVerifications", uid),
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? readVerification(snapshot.data() as Record<string, unknown>)
          : null
      );
    },
    (error) => onError?.(error)
  );
}
