import { isValidUsername, normalizeUsername } from "./userIdentity.ts";

export type PublicProfileDocument = {
  age: number;
  bio: string;
  city: string;
  club: string;
  name: string;
  photoURL: string;
  position: string;
  profileCompleted: true;
  uid: string;
  username: string;
};

function normalizeText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

export function normalizePublicProfileDocument(
  uid: string,
  value: unknown
): PublicProfileDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const username = normalizeUsername(normalizeText(data.username, 30));
  const age = typeof data.age === "number" ? data.age : Number.NaN;
  const normalized: PublicProfileDocument = {
    age,
    bio: normalizeText(data.bio, 240),
    city: normalizeText(data.city, 80),
    club: normalizeText(data.club, 80),
    name: normalizeText(data.name, 80),
    photoURL: normalizeText(data.photoURL, 2048),
    position: normalizeText(data.position, 40),
    profileCompleted: true,
    uid,
    username
  };

  if (
    data.uid !== uid ||
    data.profileCompleted !== true ||
    !isValidUsername(username) ||
    !Number.isInteger(age) ||
    age < 5 ||
    age > 100 ||
    normalized.name.length < 3 ||
    normalized.bio.length < 10 ||
    normalized.position.length < 2 ||
    normalized.city.length < 2 ||
    normalized.club.length < 2
  ) {
    return null;
  }

  return normalized;
}