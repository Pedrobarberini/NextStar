export function normalizeProfileSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^@+/, "")
    .toLocaleLowerCase("pt-BR");
}

export function matchesProfileSearch(
  query: string,
  values: Array<string | undefined>
) {
  const normalizedQuery = normalizeProfileSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) =>
    normalizeProfileSearchValue(value ?? "").includes(normalizedQuery)
  );
}

export function filterFollowedProfiles<T extends { profileId: string }>(
  profiles: T[],
  followingProfileIds: string[]
) {
  const followingSet = new Set(followingProfileIds);
  return profiles.filter((profile) => followingSet.has(profile.profileId));
}