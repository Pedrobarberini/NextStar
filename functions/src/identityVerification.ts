import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { REGION } from "./config";

/**
 * Mantém o selo público estritamente dependente de duas fontes autoritativas:
 * identidade aprovada pelo backend de KYC e assinatura autorizada pelo provedor.
 * O cliente nunca pode escrever nenhum desses estados.
 */
export const syncIdentityVerificationBadge = onDocumentWritten(
  {
    document: "identityVerifications/{uid}",
    region: REGION
  },
  async (event) => {
    const uid = event.params.uid;
    const status = event.data?.after.data()?.status;
    const identityVerified = status === "approved";
    const database = getFirestore();
    const [profile, subscription] = await Promise.all([
      database.doc(`profiles/${uid}`).get(),
      database.doc(`subscriptions/${uid}`).get()
    ]);

    if (!profile.exists) return;

    await profile.ref.update({
      identityVerified,
      plusActive:
        identityVerified && subscription.data()?.status === "authorized",
      updatedAt: FieldValue.serverTimestamp()
    });
  }
);
