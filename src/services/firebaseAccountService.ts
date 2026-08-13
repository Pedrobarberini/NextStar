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
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseFunctions,
  getPublicAppUrl,
  isFirebaseConfigured
} from "../config/firebase";
import type { AuthProvider } from "../types";

const ACCOUNTS_COLLECTION = "accounts";
const PENDING_ACCOUNTS_COLLECTION = "pendingAccounts";

export class FirebaseUnavailableError extends Error {
  constructor() {
    super("O serviço de contas ainda não está configurado neste ambiente.");
    this.name = "FirebaseUnavailableError";
  }
}

export class EmailVerificationRequiredError extends Error {
  constructor() {
    super("Confirme o e-mail enviado pela Xolot antes de entrar.");
    this.name = "EmailVerificationRequiredError";
  }
}

export class AccountRegistrationRequiredError extends Error {
  constructor() {
    super("Esta identidade ainda não possui uma conta Xolot cadastrada.");
    this.name = "AccountRegistrationRequiredError";
  }
}

export class AccountCompletionRequiredError extends Error {
  constructor() {
    super("Esta identidade existe, mas o cadastro Xolot precisa ser concluído.");
    this.name = "AccountCompletionRequiredError";
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

function getPendingAccountReference(uid: string) {
  return doc(getFirebaseFirestore(), PENDING_ACCOUNTS_COLLECTION, uid);
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

  if (!user.emailVerified) {
    throw new EmailVerificationRequiredError();
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

async function createPendingFirebaseAccount(
  user: User,
  acceptedTerms: boolean
) {
  if (!acceptedTerms || !user.uid) {
    throw new Error("Aceite os termos para criar a conta.");
  }

  await setDoc(getPendingAccountReference(user.uid), {
    authProvider: "password",
    createdAt: serverTimestamp(),
    termsAcceptedAt: serverTimestamp(),
    uid: user.uid
  });
}

async function activateVerifiedFirebaseAccount(
  user: User,
  acceptedTerms = false
) {
  if (!user.uid || !user.emailVerified) {
    throw new EmailVerificationRequiredError();
  }

  const finalizeAccount = httpsCallable<
    { acceptedTerms: boolean },
    { created: boolean }
  >(getFirebaseFunctions(), "finalizeAccountRegistration");

  try {
    await finalizeAccount({ acceptedTerms });
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "functions/failed-precondition"
    ) {
      throw new AccountCompletionRequiredError();
    }
    throw error;
  }
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
    await createPendingFirebaseAccount(credential.user, acceptedTerms);
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  } finally {
    await signOut(auth).catch(() => undefined);
  }
}

export async function signInWithEmailAndPasswordSecurely(
  email: string,
  password: string,
  acceptedTerms = false
) {
  assertFirebaseAvailable();
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  await credential.user.reload();
  const authenticatedUser = auth.currentUser ?? credential.user;
  await authenticatedUser.getIdToken(true);

  if (!authenticatedUser.emailVerified) {
    await sendEmailVerification(authenticatedUser, {
      url: `${getPublicAppUrl()}/?emailVerified=1`
    }).catch(() => undefined);
    await signOut(auth).catch(() => undefined);
    throw new EmailVerificationRequiredError();
  }

  try {
    if (!(await hasFirebaseAccount(authenticatedUser.uid))) {
      await activateVerifiedFirebaseAccount(authenticatedUser, acceptedTerms);
    }
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    throw error;
  }

  return authenticatedUser;
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
    error instanceof AccountRegistrationRequiredError ||
    error instanceof AccountCompletionRequiredError
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
    return "A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.";
  }

  if (error.code === "auth/email-already-in-use") {
    return "Este e-mail já possui uma conta Xolot. Use Entrar e escolha o mesmo método usado no primeiro acesso, como Google.";
  }

  if (error.code === "auth/invalid-email") {
    return "O e-mail informado não é válido. Verifique o endereço e tente novamente.";
  }

  if (error.code === "auth/missing-password") {
    return "Digite uma senha para criar sua conta.";
  }

  if (error.code === "auth/user-disabled") {
    return "Esta conta foi desativada. Entre em contato com o suporte da Xolot.";
  }

  if (error.code === "auth/credential-already-in-use") {
    return "Esta forma de acesso já está vinculada a outra conta Xolot.";
  }

  if (error.code === "auth/operation-not-allowed") {
    return "Este método de acesso ainda não foi habilitado no Firebase.";
  }

  if (error.code === "auth/unauthorized-domain") {
    return "Este domínio ainda não foi autorizado no Firebase Authentication. Adicione xolot.com.br em Configurações > Domínios autorizados.";
  }

  if (error.code === "auth/popup-blocked") {
    return "O navegador bloqueou a janela de autenticação. Permita pop-ups para a Xolot e tente novamente.";
  }

  if (error.code === "auth/account-exists-with-different-credential") {
    return "Já existe uma conta para este e-mail usando outro método de entrada. Entre pelo método usado no cadastro.";
  }

  if (
    error.code === "auth/invalid-continue-uri" ||
    error.code === "auth/unauthorized-continue-uri"
  ) {
    return "O endereço de retorno da autenticação não está autorizado no Firebase.";
  }

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/wrong-password" ||
    error.code === "auth/user-not-found"
  ) {
    return "E-mail ou senha inválidos.";
  }

  return "Não foi possível concluir a autenticação. Confira os dados e tente novamente.";
}