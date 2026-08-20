import type { Player, TagCatalogEntry, VideoSubmission } from "../types";

export const MAX_PROFILE_TAGS = 6;
export const MAX_POST_TAGS = 10;
export const MAX_TAG_LENGTH = 40;

export function normalizeTagKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TAG_LENGTH);
}

export function normalizeTagLabel(value: string) {
  return value
    .trim()
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N} ._-]+/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, MAX_TAG_LENGTH)
    .trim();
}

export function normalizeTagList(values: string[], maximum: number) {
  const tags = new Map<string, string>();
  values.forEach((value) => {
    const key = normalizeTagKey(value);
    const label = normalizeTagLabel(value);
    if (key && label && !tags.has(key)) tags.set(key, label);
  });
  return [...tags.values()].slice(0, Math.max(0, maximum));
}

export function mergeTagCatalog(
  remoteEntries: TagCatalogEntry[],
  submissions: VideoSubmission[],
  defaults: readonly string[] = []
) {
  const entries = new Map<string, TagCatalogEntry>();

  [...defaults].forEach((label) => {
    const key = normalizeTagKey(label);
    if (key) entries.set(key, { creatorCount: 0, key, label, postCount: 0 });
  });

  remoteEntries.forEach((entry) => {
    const key = normalizeTagKey(entry.key || entry.label);
    const label = normalizeTagLabel(entry.label);
    if (!key || !label) return;
    entries.set(key, {
      creatorCount: Math.max(0, Math.round(entry.creatorCount)),
      key,
      label,
      postCount: Math.max(0, Math.round(entry.postCount))
    });
  });

  const localPosts = new Map<string, number>();
  const localCreators = new Map<string, Set<string>>();
  submissions.forEach((submission) => {
    const uniqueTags = new Map<string, string>();
    (submission.tags ?? []).forEach((tag) => {
      const key = normalizeTagKey(tag);
      const label = normalizeTagLabel(tag);
      if (key && label) uniqueTags.set(key, label);
    });
    uniqueTags.forEach((label, key) => {
      localPosts.set(key, (localPosts.get(key) ?? 0) + 1);
      const creators = localCreators.get(key) ?? new Set<string>();
      creators.add(submission.userId);
      localCreators.set(key, creators);
      if (!entries.has(key)) {
        entries.set(key, { creatorCount: 0, key, label, postCount: 0 });
      }
    });
  });

  return [...entries.values()]
    .map((entry) => ({
      ...entry,
      creatorCount: Math.max(
        entry.creatorCount,
        localCreators.get(entry.key)?.size ?? 0
      ),
      postCount: Math.max(entry.postCount, localPosts.get(entry.key) ?? 0)
    }))
    .sort(
      (left, right) =>
        right.creatorCount - left.creatorCount ||
        right.postCount - left.postCount ||
        left.label.localeCompare(right.label, "pt-BR")
    );
}

export function searchTagCatalog(
  entries: TagCatalogEntry[],
  query: string,
  maximum = 7
) {
  const normalizedQuery = normalizeTagKey(query);
  return entries
    .filter(
      (entry) =>
        !normalizedQuery || normalizeTagKey(entry.label).includes(normalizedQuery)
    )
    .slice(0, Math.max(0, maximum));
}
export function getPlayerTagKeys(player: Player) {
  return [...new Set(player.tags.map(normalizeTagKey).filter(Boolean))].map(
    (key) => `tag:${key}`
  );
}

export function buildTagAffinityScores(
  declaredTags: string[],
  explicitContentKeys: Set<string>,
  likedPlayerIds: Set<string>,
  players: Player[]
) {
  const scores = new Map<string, number>();
  declaredTags.forEach((tag) => {
    const key = normalizeTagKey(tag);
    if (key) scores.set(`tag:${key}`, 100);
  });
  explicitContentKeys.forEach((key) => {
    if (key.startsWith("tag:")) {
      scores.set(key, Math.max(scores.get(key) ?? 0, 80));
    }
  });
  players.forEach((player) => {
    if (!likedPlayerIds.has(player.id)) return;
    getPlayerTagKeys(player).forEach((key) => {
      const currentScore = scores.get(key) ?? 0;
      scores.set(
        key,
        currentScore >= 80
          ? Math.min(160, currentScore + 12)
          : Math.min(70, currentScore + 12)
      );
    });
  });
  return scores;
}

export function getPlayerTagAffinityScore(
  player: Player,
  scores: Map<string, number>
) {
  return getPlayerTagKeys(player).reduce(
    (total, key) => total + (scores.get(key) ?? 0),
    0
  );
}