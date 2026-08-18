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

export function selectFeedContentFit({
  containerHeight,
  containerWidth,
  mediaHeight,
  mediaWidth
}: {
  containerHeight: number;
  containerWidth: number;
  mediaHeight?: number;
  mediaWidth?: number;
}): "contain" | "cover" {
  if (
    !mediaHeight ||
    !mediaWidth ||
    containerHeight <= 0 ||
    containerWidth <= 0
  ) {
    return "contain";
  }

  const containerAspectRatio = containerWidth / containerHeight;
  const mediaAspectRatio = mediaWidth / mediaHeight;
  const relativeDifference =
    Math.abs(mediaAspectRatio - containerAspectRatio) / containerAspectRatio;

  return relativeDifference <= 0.15 ? "cover" : "contain";
}
