import type {
  CampaignObjective,
  CampaignStatus,
  ProfessionalCategory,
  ProfessionalPlanId,
  ProfessionalSettings,
  ProfessionalSettingsByUser,
  PromotionCampaign,
  VideoSubmission
} from "../types";
import { migrateSubmissionToDirectPublication } from "../utils/publication.ts";

export const APP_STATE_SCHEMA_VERSION = 6;

export type LocalAppState = {
  campaigns: PromotionCampaign[];
  professionalSettingsByUser: ProfessionalSettingsByUser;
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
    campaigns: [],
    professionalSettingsByUser: {},
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

  return {
    campaigns: normalizeCampaigns(value.campaigns),
    professionalSettingsByUser: normalizeProfessionalSettingsByUser(
      value.professionalSettingsByUser
    ),
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
