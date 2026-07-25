import type {
  AppUser,
  CampaignObjective,
  CampaignStatus,
  ProfessionalCategory,
  ProfessionalPlanId,
  ProfessionalSettings,
  ProfessionalSettingsByUser,
  PromotionCampaign,
  VideoSubmission
} from "../types";
import {
  claimUniqueUsername,
  createUsernameSlug
} from "../utils/userIdentity.ts";
import { migrateSubmissionToDirectPublication } from "../utils/publication.ts";

export const APP_STATE_SCHEMA_VERSION = 5;

export type LocalAppState = {
  activeUser: AppUser | null;
  campaigns: PromotionCampaign[];
  professionalSettingsByUser: ProfessionalSettingsByUser;
  registeredUsers: AppUser[];
  submissions: VideoSubmission[];
  version: typeof APP_STATE_SCHEMA_VERSION;
};

export type LocalStateStorage = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function createDefaultLocalAppState(): LocalAppState {
  return {
    activeUser: null,
    campaigns: [],
    professionalSettingsByUser: {},
    registeredUsers: [],
    submissions: [],
    version: APP_STATE_SCHEMA_VERSION
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeArray<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAppUser(value: unknown): AppUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id);
  const email = normalizeString(value.email).toLowerCase();
  const role = value.role === "Admin" ? "Admin" : "Usuário";

  if (!id || !email.includes("@")) {
    return null;
  }

  const age =
    typeof value.age === "number" &&
    Number.isInteger(value.age) &&
    value.age >= 5 &&
    value.age <= 100
      ? value.age
      : null;
  const passwordHash = normalizeString(value.passwordHash);
  const passwordSalt = normalizeString(value.passwordSalt);
  const googleUid = normalizeString(value.googleUid);
  const photoURL = normalizeString(value.photoURL);
  const authProvider =
    value.authProvider === "google" || value.authProvider === "password"
      ? value.authProvider
      : googleUid
        ? "google"
        : passwordHash && passwordSalt
          ? "password"
          : undefined;
  const bio = normalizeString(value.bio);
  const profileCompleted =
    role === "Admin" ||
    (value.profileCompleted === true &&
      normalizeString(value.name).length >= 3 &&
      age !== null &&
      bio.length >= 10 &&
      bio.length <= 240 &&
      normalizeString(value.position).length >= 2 &&
      normalizeString(value.city).length >= 2 &&
      normalizeString(value.club).length >= 2);

  return {
    acceptedTerms: value.acceptedTerms === true,
    age,
    ...(authProvider ? { authProvider } : {}),
    bio,
    city: normalizeString(value.city),
    club: normalizeString(value.club),
    email,
    ...(googleUid ? { googleUid } : {}),
    id,
    name:
      normalizeString(value.name) ||
      (role === "Admin" ? "Admin Xolot" : email.split("@")[0]),
    ...(passwordHash && passwordSalt
      ? { passwordHash, passwordSalt }
      : {}),
    ...(photoURL ? { photoURL } : {}),
    position: normalizeString(value.position),
    profileCompleted,
    role,
    username: createUsernameSlug(
      normalizeString(value.username) || email.split("@")[0],
      id
    )
  };
}

function normalizeUsers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeAppUser)
    .filter((account): account is AppUser => Boolean(account));
}

function assignUniqueUsernames(users: AppUser[]) {
  const takenUsernames = new Set<string>();

  return users.map((account) => ({
    ...account,
    username: claimUniqueUsername(
      account.username,
      takenUsernames,
      account.id
    )
  }));
}

const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  "talent",
  "creator",
  "business",
  "brand",
  "project",
  "service"
];
const PROFESSIONAL_PLANS: ProfessionalPlanId[] = ["free", "pro", "business"];
const CAMPAIGN_OBJECTIVES: CampaignObjective[] = [
  "reach",
  "profile_visits",
  "messages"
];
const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "active",
  "paused",
  "completed"
];

function normalizeProfessionalSettings(
  value: unknown
): ProfessionalSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  const category = PROFESSIONAL_CATEGORIES.includes(
    value.category as ProfessionalCategory
  )
    ? (value.category as ProfessionalCategory)
    : "talent";
  const plan = PROFESSIONAL_PLANS.includes(value.plan as ProfessionalPlanId)
    ? (value.plan as ProfessionalPlanId)
    : "free";

  return {
    category,
    enabled: value.enabled === true,
    externalLink: normalizeString(value.externalLink),
    plan,
    updatedAt: normalizeString(value.updatedAt) || new Date(0).toISOString()
  };
}

function normalizeProfessionalSettingsByUser(
  value: unknown
): ProfessionalSettingsByUser {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([userId, settings]) => [
        userId.trim(),
        normalizeProfessionalSettings(settings)
      ] as const)
      .filter(
        (entry): entry is readonly [string, ProfessionalSettings] =>
          Boolean(entry[0] && entry[1])
      )
  );
}

function normalizeCampaign(value: unknown): PromotionCampaign | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id);
  const ownerUserId = normalizeString(value.ownerUserId);
  const playerId = normalizeString(value.playerId);
  const profileId = normalizeString(value.profileId);
  const title = normalizeString(value.title);
  const objective = CAMPAIGN_OBJECTIVES.includes(
    value.objective as CampaignObjective
  )
    ? (value.objective as CampaignObjective)
    : "reach";
  const status = CAMPAIGN_STATUSES.includes(value.status as CampaignStatus)
    ? (value.status as CampaignStatus)
    : "paused";

  if (!id || !ownerUserId || !playerId || !profileId || !title) {
    return null;
  }

  const normalizeMetric = (metric: unknown) =>
    typeof metric === "number" && Number.isFinite(metric) && metric >= 0
      ? metric
      : 0;

  return {
    budget: normalizeMetric(value.budget),
    clicks: normalizeMetric(value.clicks),
    createdAt: normalizeString(value.createdAt) || new Date(0).toISOString(),
    durationDays: Math.max(1, Math.round(normalizeMetric(value.durationDays))),
    estimatedReach: normalizeMetric(value.estimatedReach),
    id,
    impressions: normalizeMetric(value.impressions),
    messages: normalizeMetric(value.messages),
    objective,
    ownerUserId,
    playerId,
    profileId,
    status,
    title
  };
}

function normalizeCampaigns(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeCampaign)
    .filter((campaign): campaign is PromotionCampaign => Boolean(campaign));
}

export function migrateLocalAppState(
  value: unknown,
  fallback: LocalAppState
): LocalAppState {
  if (!isRecord(value)) {
    return fallback;
  }

  const normalizedActiveUser =
    value.activeUser === null
      ? null
      : normalizeAppUser(value.activeUser) ?? fallback.activeUser;
  const normalizedUsers = normalizeUsers(value.registeredUsers);
  const registeredUsers = assignUniqueUsernames(
    normalizedActiveUser
      ? [
          normalizedActiveUser,
          ...normalizedUsers.filter(
            (account) => account.id !== normalizedActiveUser.id
          )
        ]
      : normalizedUsers
  );
  const activeUser = normalizedActiveUser
    ? registeredUsers.find(
        (account) => account.id === normalizedActiveUser.id
      ) ?? normalizedActiveUser
    : null;

  return {
    activeUser,
    campaigns: normalizeCampaigns(value.campaigns),
    professionalSettingsByUser: normalizeProfessionalSettingsByUser(
      value.professionalSettingsByUser
    ),
    registeredUsers:
      registeredUsers.length > 0 ? registeredUsers : fallback.registeredUsers,
    submissions: normalizeArray(
      value.submissions,
      fallback.submissions
    ).map(migrateSubmissionToDirectPublication),
    version: APP_STATE_SCHEMA_VERSION
  };
}

export function parseLocalAppState(
  serializedState: string | null,
  fallback: LocalAppState
) {
  if (!serializedState) {
    return fallback;
  }

  try {
    return migrateLocalAppState(JSON.parse(serializedState), fallback);
  } catch {
    return fallback;
  }
}

export function serializeLocalAppState(state: LocalAppState) {
  return JSON.stringify({
    ...state,
    version: APP_STATE_SCHEMA_VERSION
  });
}

export function createLocalAppStateRepository(
  storage: LocalStateStorage,
  storageKey: string
) {
  return {
    async clear() {
      await storage.removeItem(storageKey);
    },
    async load(fallback: LocalAppState) {
      const storedState = await storage.getItem(storageKey);
      return parseLocalAppState(storedState, fallback);
    },
    async save(state: LocalAppState) {
      await storage.setItem(storageKey, serializeLocalAppState(state));
    }
  };
}
