const EMPTY_PROFILE_VALUES = new Set([
  "Área não informada",
  "Local não informado",
  "Modalidade não informada"
]);

function visibleValue(value?: string) {
  const normalized = value?.trim() ?? "";
  return normalized && !EMPTY_PROFILE_VALUES.has(normalized) ? normalized : "";
}

export function formatProfileActivity(
  sport?: string,
  specialty?: string,
  city?: string
) {
  const activity = [visibleValue(sport), visibleValue(specialty)]
    .filter(Boolean)
    .join(" · ");
  return [activity, visibleValue(city)].filter(Boolean).join(" | ");
}
