import type { FirebaseApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

export function initializeFirebaseAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}