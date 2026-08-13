export const MEDIA_DOUBLE_TAP_DELAY_MS = 260;
export const MEDIA_POST_DOUBLE_TAP_SUPPRESSION_MS = 320;
export const MEDIA_HOLD_RELEASE_SUPPRESSION_MS = 420;

export type MediaTapGestureState = {
  pendingTapAt: number | null;
  suppressUntil: number;
};

export type MediaTapGestureAction = "double" | "ignore" | "schedule-single";

export function createMediaTapGestureState(): MediaTapGestureState {
  return {
    pendingTapAt: null,
    suppressUntil: 0
  };
}

export function suppressMediaTapGesture(
  state: MediaTapGestureState,
  releasedAt: number
): MediaTapGestureState {
  return {
    pendingTapAt: null,
    suppressUntil: Math.max(
      state.suppressUntil,
      releasedAt + MEDIA_HOLD_RELEASE_SUPPRESSION_MS
    )
  };
}

export function resolveMediaTapGesture(
  state: MediaTapGestureState,
  pressedAt: number
): { action: MediaTapGestureAction; state: MediaTapGestureState } {
  if (pressedAt < state.suppressUntil) {
    return { action: "ignore", state };
  }

  if (
    state.pendingTapAt !== null &&
    pressedAt - state.pendingTapAt <= MEDIA_DOUBLE_TAP_DELAY_MS
  ) {
    return {
      action: "double",
      state: {
        pendingTapAt: null,
        suppressUntil: pressedAt + MEDIA_POST_DOUBLE_TAP_SUPPRESSION_MS
      }
    };
  }

  return {
    action: "schedule-single",
    state: {
      pendingTapAt: pressedAt,
      suppressUntil: state.suppressUntil
    }
  };
}