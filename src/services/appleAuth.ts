import {
  OAuthProvider,
  User,
  signInWithPopup
} from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseConfigured
} from "../config/firebase";

export type AppleIdentity = {
  email: string;
  name: string;
  photoURL?: string;
  uid: string;
};

export class AppleAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleAuthConfigurationError";
  }
}

export class AppleAuthCancelledError extends Error {
  constructor() {
    super("Login com Apple cancelado.");
    this.name = "AppleAuthCancelledError";
  }
}

function toAppleIdentity(user: User): AppleIdentity {
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "A conta Apple não retornou um email. Autorize o compartilhamento do email ou use outra forma de acesso."
    );
  }

  return {
    email,
    name: user.displayName?.trim() || email.split("@")[0] || "Usuário",
    uid: user.uid,
    ...(user.photoURL ? { photoURL: user.photoURL } : {})
  };
}

export function assertAppleAuthConfigured() {
  if (!isFirebaseConfigured()) {
    throw new AppleAuthConfigurationError(
      "Configure as variáveis EXPO_PUBLIC_FIREBASE_* no arquivo .env para ativar o login com Apple."
    );
  }
}

export async function signInWithAppleOnWeb(): Promise<AppleIdentity> {
  assertAppleAuthConfigured();

  const auth = getFirebaseAuth();
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  provider.setCustomParameters({ locale: "pt_BR" });

  try {
    const result = await signInWithPopup(auth, provider);
    return toAppleIdentity(result.user);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (
      code === "auth/cancelled-popup-request" ||
      code === "auth/popup-closed-by-user"
    ) {
      throw new AppleAuthCancelledError();
    }

    throw error;
  }
}
