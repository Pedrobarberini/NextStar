import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseFirestore } from "../config/firebase";
import { getCurrentFirebaseUser } from "./firebaseAccountService";
import type { AccountProfile, AppUser, AuthProvider } from "../types";
import { isValidUsername, normalizeUsername } from "../utils/userIdentity";
import { MAX_PROFILE_TAGS, normalizeTagList } from "../utils/tagCatalog";
import {
  type PublicProfileDocument,
  normalizePublicProfileDocument
} from "../utils/firebaseProfileDocument";

const PROFILES_COLLECTION = "profiles";
const USERNAMES_COLLECTION = "usernames";
const MAX_PUBLIC_PROFILES = 200;

export class UsernameAlreadyInUseError extends Error {
  constructor() {
    super("Este nome de usuário já está em uso.");
    this.name = "UsernameAlreadyInUseError";
  }
}

export class InvalidPublicProfileError extends Error {
  constructor() {
    super("Os dados do perfil não atendem aos limites permitidos.");
    this.name = "InvalidPublicProfileError";
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

function createProvisionalUsername(user: User) {
  const emailPrefix = user.email?.split("@")[0] ?? "usuario";
  const normalized = emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);

  return isValidUsername(normalized) ? normalized : "usuario.xolot";
}

export function createProvisionalFirebaseUser(user: User): AppUser {
  return {
    acceptedTerms: true,
    age: null,
    authProvider: getAuthProvider(user),
    bio: "",
    city: "",
    club: "",
    interestTags: [],
    email: user.email?.trim().toLowerCase() ?? "",
    googleUid: getAuthProvider(user) === "google" ? user.uid : undefined,
    id: user.uid,
    name: user.displayName?.trim() || "Novo perfil",
    photoURL: user.photoURL ?? undefined,
    position: "",
    sport: "",
    profileCompleted: false,
    role: "Usuário",
    username: createProvisionalUsername(user)
  };
}

export function toPublicAppUser(
  profile: PublicProfileDocument,
  currentUser?: User | null
): AppUser {
  const currentAuthUser = currentUser?.uid === profile.uid ? currentUser : null;

  return {
    acceptedTerms: Boolean(currentAuthUser),
    age: profile.age,
    authProvider: currentAuthUser ? getAuthProvider(currentAuthUser) : undefined,
    bio: profile.bio,
    city: profile.city,
    club: profile.club,
    interestTags: profile.interestTags,
    email: currentAuthUser?.email?.trim().toLowerCase() ?? "",
    googleUid:
      currentAuthUser && getAuthProvider(currentAuthUser) === "google"
        ? currentAuthUser.uid
        : undefined,
    id: profile.uid,
    name: profile.name,
    photoURL: profile.photoURL || undefined,
    plusActive: profile.plusActive,
    position: profile.position,
    sport: profile.sport,
    profileCompleted: true,
    role: "Usuário",
    username: profile.username
  };
}

export async function loadFirebaseAppUser(user: User) {
  const profileSnapshot = await getDoc(
    doc(getFirebaseFirestore(), PROFILES_COLLECTION, user.uid)
  );
  const profile = profileSnapshot.exists()
    ? normalizePublicProfileDocument(user.uid, profileSnapshot.data())
    : null;

  return profile
    ? toPublicAppUser(profile, user)
    : createProvisionalFirebaseUser(user);
}

export function subscribeFirebaseProfiles(
  currentUser: User,
  onProfiles: (profiles: AppUser[]) => void,
  onError?: (error: Error) => void
) {
  const profilesQuery = query(
    collection(getFirebaseFirestore(), PROFILES_COLLECTION),
    limit(MAX_PUBLIC_PROFILES)
  );

  return onSnapshot(
    profilesQuery,
    (snapshot) => {
      const profiles = snapshot.docs
        .map((profileDocument) =>
          normalizePublicProfileDocument(
            profileDocument.id,
            profileDocument.data(),
            {
              allowLegacyFallback: profileDocument.id !== currentUser.uid
            }
          )
        )
        .filter((profile): profile is PublicProfileDocument => Boolean(profile))
        .map((profile) => toPublicAppUser(profile, currentUser));
      onProfiles(profiles);
    },
    (error) => onError?.(error)
  );
}

export async function saveFirebaseProfile(
  uid: string,
  profile: AccountProfile,
  photoURL = ""
) {
  const authenticatedUser = getCurrentFirebaseUser();
  if (
    !authenticatedUser ||
    authenticatedUser.uid !== uid ||
    !authenticatedUser.emailVerified
  ) {
    throw new InvalidPublicProfileError();
  }

  const username = normalizeUsername(profile.username);
  const normalizedProfile = {
    age: profile.age,
    bio: profile.bio.trim(),
    city: profile.city.trim(),
    club: profile.club.trim(),
    interestTags: normalizeTagList(profile.interestTags, MAX_PROFILE_TAGS),
    name: profile.name.trim(),
    photoURL: photoURL.trim(),
    position: profile.position.trim(),
    sport: profile.sport.trim(),
    profileCompleted: true as const,
    uid,
    username
  };

  if (
    !isValidUsername(username) ||
    normalizedProfile.age === null ||
    normalizedProfile.age < 5 ||
    normalizedProfile.age > 100 ||
    normalizedProfile.name.length < 3 ||
    normalizedProfile.name.length > 80 ||
    normalizedProfile.bio.length < 10 ||
    normalizedProfile.bio.length > 240 ||
    normalizedProfile.position.length < 2 ||
    normalizedProfile.position.length > 40 ||
    normalizedProfile.sport.length < 2 ||
    normalizedProfile.sport.length > 40 ||
    normalizedProfile.city.length < 2 ||
    normalizedProfile.city.length > 80 ||
    normalizedProfile.club.length > 80 ||
    (normalizedProfile.club.length > 0 &&
      normalizedProfile.club.length < 2) ||
    normalizedProfile.photoURL.length > 2048
  ) {
    throw new InvalidPublicProfileError();
  }

  const firestore = getFirebaseFirestore();
  const profileReference = doc(firestore, PROFILES_COLLECTION, uid);
  const usernameReference = doc(firestore, USERNAMES_COLLECTION, username);

  await runTransaction(firestore, async (transaction) => {
    const profileSnapshot = await transaction.get(profileReference);
    const previousUsername = profileSnapshot.exists()
      ? normalizeUsername(String(profileSnapshot.data().username ?? ""))
      : "";
    const usernameSnapshot = await transaction.get(usernameReference);
    const previousUsernameReference =
      previousUsername && previousUsername !== username
        ? doc(firestore, USERNAMES_COLLECTION, previousUsername)
        : null;
    const previousUsernameSnapshot = previousUsernameReference
      ? await transaction.get(previousUsernameReference)
      : null;

    if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== uid) {
      throw new UsernameAlreadyInUseError();
    }

    if (
      previousUsernameSnapshot?.exists() &&
      previousUsernameSnapshot.data().uid !== uid
    ) {
      throw new InvalidPublicProfileError();
    }

    const currentProfileData = profileSnapshot.data();
    const serverManagedProfileFields =
      typeof currentProfileData?.plusActive === "boolean"
        ? { plusActive: currentProfileData.plusActive }
        : {};

    transaction.set(profileReference, {
      ...normalizedProfile,
      ...serverManagedProfileFields,
      createdAt: profileSnapshot.exists()
        ? profileSnapshot.data().createdAt
        : serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (!usernameSnapshot.exists()) {
      transaction.set(usernameReference, {
        createdAt: serverTimestamp(),
        uid
      });
    }

    if (previousUsernameReference && previousUsernameSnapshot?.exists()) {
      transaction.delete(previousUsernameReference);
    }
  });

  return normalizedProfile;
}