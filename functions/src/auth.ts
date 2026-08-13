import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export function requireVerifiedUser(request: {
  auth?: { uid: string; token: Record<string, unknown> };
}) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Entre na sua conta para publicar.");
  }

  if (request.auth.token.email_verified !== true) {
    throw new HttpsError(
      "permission-denied",
      "Confirme seu e-mail antes de publicar."
    );
  }

  return request.auth.uid;
}

export async function verifyRegisteredUser(uid: string) {
  const database = getFirestore();
  const [account, profile] = await Promise.all([
    database.doc(`accounts/${uid}`).get(),
    database.doc(`profiles/${uid}`).get()
  ]);
  if (!account.exists && profile.data()?.profileCompleted !== true) {
    throw new HttpsError(
      "permission-denied",
      "Complete o cadastro da sua conta antes de publicar."
    );
  }
}
