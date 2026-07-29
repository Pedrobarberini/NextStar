import { FirebaseError } from "firebase/app";
import {
  type User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getPublicAppUrl,
  isFirebaseConfigured
} from "../config/firebase";
import type { AuthProvider } from "../types";

const ACCOUNTS_COLLECTION = "accounts";

export class FirebaseUnavailableError extends Error {
  constructor() {
    super("O serviço de contas ainda não está configurado neste ambiente.");
    this.name = "FirebaseUnavailableError";
  }
}

export class EmailVerificationRequiredError extends Error {
  constructor() {
    super("Confirme o email enviado pela Xolot antes de entrar.");
    this.name = "EmailVerificationRequiredError";
  }
}

export class AccountRegistrationRequiredError extends Error {
  constructor() {
    super("Esta identidade ainda não possui uma conta Xolot cadastrada.");
    this.name = "AccountRegistrationRequiredError";
  }
}

function assertFirebaseAvailable() {
  if (!isFirebaseConfigured()) {
    throw new FirebaseUnavailableError();
  }
}

function getAuthProvider(user: User): AuthProvider {
  if (user.providerData.some((provider) => provider.providerId === "apple.com")) {
    return "apple";
  }

  return user.providerData.some((provider) => provider.providerId === "google.com")
    ? "google"
    : "password";
}

function getAccountReference(uid: string) {
  return doc(getFirebaseFirestore(), ACCOUNTS_COLLECTION, uid);
}

export async function hasFirebaseAccount(uid: string) {
  assertFirebaseAvailable();
  return (await getDoc(getAccountReference(uid))).exists();
}

export async function createFirebaseAccountMetadata(
  user: User,
  acceptedTerms: boolean
) {
  assertFirebaseAvailable();

  if (!acceptedTerms || !user.uid) {
    throw new Error("É necessário aceitar os termos para criar a conta.");
  }

  const accountReference = getAccountReference(user.uid);
  const existingAccount = await getDoc(accountReference);

  if (existingAccount.exists()) {
    return;
  }

  await setDoc(accountReference, {
    authProvider: getAuthProvider(user),
    createdAt: serverTimestamp(),
    termsAcceptedAt: serverTimestamp(),
    uid: user.uid
  });
}

export async function registerWithEmailAndPassword(
  email: string,
  password: string,
  acceptedTerms: boolean
) {
  assertFirebaseAvailable();

  if (!acceptedTerms) {
    throw new Error("É necessário aceitar os termos para criar a conta.");
  }

  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  try {
    await sendEmailVerification(credential.user, {
      url: `${getPublicAppUrl()}/?emailVerified=1`
    });
    await createFirebaseAccountMetadata(credential.user, acceptedTerms);
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

export async function signInWithEmailAndPasswordSecurely(
  email: string,
  password: string
) {
  assertFirebaseAvailable();
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  if (!credential.user.emailVerified) {
    await sendEmailVerification(credential.user, {
      url: `${getPublicAppUrl()}/?emailVerified=1`
    }).catch(() => undefined);
    await signOut(auth).catch(() => undefined);
    throw new EmailVerificationRequiredError();
  }

  if (!(await hasFirebaseAccount(credential.user.uid))) {
    await signOut(auth).catch(() => undefined);
    throw new AccountRegistrationRequiredError();
  }

  return credential.user;
}

export async function sendFirebasePasswordReset(email: string) {
  assertFirebaseAvailable();
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase(), {
    url: getPublicAppUrl()
  });
}

export function observeFirebaseAuth(onChange: (user: User | null) => void) {
  assertFirebaseAvailable();
  return onAuthStateChanged(getFirebaseAuth(), onChange);
}

export function getCurrentFirebaseUser() {
  return isFirebaseConfigured() ? getFirebaseAuth().currentUser : null;
}

export async function signOutFirebaseSession() {
  if (!isFirebaseConfigured()) {
    return;
  }

  await signOut(getFirebaseAuth());
}

export function getSafeFirebaseAuthMessage(error: unknown) {
  if (
    error instanceof FirebaseUnavailableError ||
    error instanceof EmailVerificationRequiredError ||
    error instanceof AccountRegistrationRequiredError
  ) {
    return error.message;
  }

  if (!(error instanceof FirebaseError)) {
    return "Não foi possível concluir a autenticação. Tente novamente.";
  }

  if (error.code === "auth/too-many-requests") {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }

  if (error.code === "auth/network-request-failed") {
    return "Sem conexão com o serviço de contas. Verifique sua internet.";
  }

  if (error.code === "auth/weak-password") {
    return "A senha não atende à política de segurança da Xolot.";
  }

  if (error.code === "auth/operation-not-allowed") {
    return "Este método de acesso ainda não foi habilitado no Firebase.";
  }

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/wrong-password" ||
    error.code === "auth/user-not-found"
  ) {
    return "Email ou senha inválidos.";
  }

  return "Não foi possível concluir a autenticação. Confira os dados e tente novamente.";
}