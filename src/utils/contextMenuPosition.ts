type ContextMenuPositionInput = {
  anchorX: number;
  anchorY: number;
  menuHeight?: number;
  menuWidth?: number;
  viewportHeight: number;
  viewportWidth: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function getContextMenuPosition({
  anchorX,
  anchorY,
  menuHeight = 154,
  menuWidth = 196,
  viewportHeight,
  viewportWidth
}: ContextMenuPositionInput) {
  const margin = 12;
  const opensToLeft = anchorX > viewportWidth / 2;
  const preferredLeft = opensToLeft
    ? anchorX - menuWidth + 22
    : anchorX - 22;
  const preferredTop = anchorY - 12;

  return {
    left: clamp(
      preferredLeft,
      margin,
      viewportWidth - menuWidth - margin
    ),
    top: clamp(
      preferredTop,
      margin,
      viewportHeight - menuHeight - margin
    )
  };
}
