export function selectFeedPlaybackIndex({
  activeIndex,
  hasOverlay,
  isNavigating,
  itemCount
}: {
  activeIndex: number;
  hasOverlay: boolean;
  isNavigating: boolean;
  itemCount: number;
}) {
  if (itemCount <= 0 || hasOverlay || isNavigating) {
    return null;
  }

  return Math.min(Math.max(activeIndex, 0), itemCount - 1);
}