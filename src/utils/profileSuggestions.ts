const GENERIC_TAGS = new Set(["novo", "publicado", "video-aprovado"]);

export const PROFILE_INTEREST_OPTIONS = [
  "Atletismo", "Basquete", "Ciclismo", "Corrida", "Counter-Strike 2",
  "EA Sports FC", "Free Fire", "Futebol", "Futsal", "Handebol",
  "League of Legends", "Lutas", "Natação", "Skate", "Tênis",
  "Treino", "Valorant", "Vôlei"
] as const;


export type ProfileTagOption = {
  count: number;
  key: string;
  label: string;
};

export type RankedProfileSuggestion<T> = T & {
  isNearby: boolean;
  matchingTags: string[];
  suggestionSource: "affinity" | "nearby" | "discovery";
  suggestionScore: number;
};

export function normalizeSuggestionTag(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSuggestionTagKey(tag: string) {
  const normalizedTag = normalizeSuggestionTag(tag);
  return normalizedTag ? `tag:${normalizedTag}` : "";
}

export function collectProfileTagOptions(
  items: Array<{ tags: string[] }>,
  maximum = 18
) {
  const options = new Map<string, ProfileTagOption>();

  items.forEach((item) => {
    const uniqueTags = new Map<string, string>();
    item.tags.forEach((tag) => {
      const key = getSuggestionTagKey(tag);
      const normalizedTag = normalizeSuggestionTag(tag);
      const label = tag.trim().replace(/^#+/, "");
      if (key && label && !GENERIC_TAGS.has(normalizedTag)) {
        uniqueTags.set(key, label);
      }
    });

    uniqueTags.forEach((label, key) => {
      const current = options.get(key);
      options.set(key, {
        count: (current?.count ?? 0) + 1,
        key,
        label: current?.label ?? label
      });
    });
  });

  return [...options.values()]
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label)
    )
    .slice(0, Math.max(0, maximum));
}

function normalizeLocation(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getLocationRegion(value: string) {
  const parts = normalizeLocation(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function haveNearbyLocation(left: string, right: string) {
  const normalizedLeft = normalizeLocation(left);
  const normalizedRight = normalizeLocation(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft === normalizedRight || (
    Boolean(getLocationRegion(normalizedLeft)) &&
    getLocationRegion(normalizedLeft) === getLocationRegion(normalizedRight)
  );
}

function getStableRotationValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function rankProfileSuggestions<
  T extends { city: string; name: string; profileId: string; tags: string[] }
>(
  profiles: T[],
  selectedContentKeys: Iterable<string>,
  context: {
    currentCity?: string;
    profileInterestTags?: Iterable<string>;
    rotationSeed?: string;
  } = {}
) {
  const behaviorTags = new Set(
    [...selectedContentKeys].filter((key) => key.startsWith("tag:"))
  );
  const profileInterestTags = new Set(
    [...(context.profileInterestTags ?? [])]
      .map(getSuggestionTagKey)
      .filter(Boolean)
  );
  const selectedTags = new Set([...behaviorTags, ...profileInterestTags]);
  const currentCity = context.currentCity ?? "";
  const rotationSeed = context.rotationSeed ?? "default";

  return profiles
    .map<RankedProfileSuggestion<T>>((profile) => {
      const tagLabels = new Map<string, string>();
      profile.tags.forEach((tag) => {
        const key = getSuggestionTagKey(tag);
        const label = tag.trim().replace(/^#+/, "");
        if (key && label && !GENERIC_TAGS.has(normalizeSuggestionTag(tag))) {
          tagLabels.set(key, label);
        }
      });
      const matchingTags = [...tagLabels]
        .filter(([key]) => selectedTags.has(key))
        .map(([, label]) => label);
      const profileInterestMatches = [...tagLabels.keys()].filter((key) =>
        profileInterestTags.has(key)
      ).length;
      const behaviorMatches = [...tagLabels.keys()].filter(
        (key) => behaviorTags.has(key) && !profileInterestTags.has(key)
      ).length;
      const suggestionScore =
        profileInterestMatches * 100 + behaviorMatches * 25;
      const isNearby = haveNearbyLocation(currentCity, profile.city);

      return {
        ...profile,
        isNearby,
        matchingTags,
        suggestionScore,
        suggestionSource:
          suggestionScore > 0
            ? "affinity"
            : isNearby
              ? "nearby"
              : "discovery"
      };
    })
    .sort(
      (left, right) =>
        right.suggestionScore - left.suggestionScore ||
        Number(right.isNearby) - Number(left.isNearby) ||
        getStableRotationValue(
          rotationSeed + "|" + currentCity + "|" + left.profileId
        ) -
          getStableRotationValue(
            rotationSeed + "|" + currentCity + "|" + right.profileId
          ) ||
        left.name.localeCompare(right.name)
    );
}
