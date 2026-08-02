export function setContentSafetySelection(
  currentIds: string[],
  targetId: string,
  selected: boolean
) {
  return selected
    ? [...new Set([...currentIds, targetId])]
    : currentIds.filter((item) => item !== targetId);
}
