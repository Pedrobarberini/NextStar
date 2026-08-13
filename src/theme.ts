export type ThemeMode = "dark" | "light";

export type ThemeColors = {
  accent: string;
  accentSoft: string;
  background: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  like: string;
  media: string;
  muted: string;
  onAccent: string;
  onPrimary: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  warning: string;
  warningSoft: string;
};

export const lightColors: ThemeColors = {
  accent: "#70C60D",
  accentSoft: "#E9F7D7",
  background: "#F5F8F5",
  border: "#D7E2DA",
  borderStrong: "#B9C9BE",
  danger: "#C43D4D",
  dangerSoft: "#FCEBED",
  info: "#2563EB",
  infoSoft: "#EAF1FF",
  like: "#F0445A",
  media: "#050A07",
  muted: "#607066",
  onAccent: "#142118",
  onPrimary: "#FEFFFE",
  primary: "#046136",
  primaryPressed: "#034C2B",
  primarySoft: "#E3F2E9",
  surface: "#FFFFFF",
  surfaceMuted: "#EDF3EE",
  text: "#142118",
  warning: "#B66B00",
  warningSoft: "#FFF2D8"
};

export const darkColors: ThemeColors = {
  accent: "#9BEA34",
  accentSoft: "#243719",
  background: "#0A0F0C",
  border: "#29372E",
  borderStrong: "#405247",
  danger: "#FF7180",
  dangerSoft: "#3B1D23",
  info: "#78A7FF",
  infoSoft: "#172640",
  like: "#FF5B70",
  media: "#000000",
  muted: "#9DADA3",
  onAccent: "#10200B",
  onPrimary: "#FFFFFF",
  primary: "#20A961",
  primaryPressed: "#16864C",
  primarySoft: "#173526",
  surface: "#111814",
  surfaceMuted: "#19221C",
  text: "#F2F7F3",
  warning: "#F1AE45",
  warningSoft: "#3B2B14"
};

const palettes: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  light: lightColors
};

let activeThemeMode: ThemeMode = "light";

export const colors = new Proxy(lightColors, {
  get(_target, property: keyof ThemeColors) {
    return palettes[activeThemeMode][property];
  }
}) as ThemeColors;

const colorTokenByLightValue = new Map<string, keyof ThemeColors>(
  Object.entries(lightColors).map(([token, value]) => [
    value,
    token as keyof ThemeColors
  ])
);

const themedValueCache: Record<ThemeMode, WeakMap<object, unknown>> = {
  dark: new WeakMap<object, unknown>(),
  light: new WeakMap<object, unknown>()
};

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function setActiveThemeMode(mode: ThemeMode) {
  activeThemeMode = mode;
}

export function getActiveThemeMode() {
  return activeThemeMode;
}

export function getThemeColors(mode = activeThemeMode) {
  return palettes[mode];
}

function resolveThemeValue(value: unknown, mode: ThemeMode): unknown {
  if (typeof value === "string") {
    const token = colorTokenByLightValue.get(value);
    return token ? palettes[mode][token] : value;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const cached = themedValueCache[mode].get(value);
  if (cached) {
    return cached;
  }

  if (Array.isArray(value)) {
    const resolvedArray: unknown[] = [];
    themedValueCache[mode].set(value, resolvedArray);
    value.forEach((item) => resolvedArray.push(resolveThemeValue(item, mode)));
    return resolvedArray;
  }

  const resolvedObject: Record<PropertyKey, unknown> = {};
  themedValueCache[mode].set(value, resolvedObject);
  Reflect.ownKeys(value).forEach((key) => {
    resolvedObject[key] = resolveThemeValue(
      (value as Record<PropertyKey, unknown>)[key],
      mode
    );
  });
  return resolvedObject;
}

export function createThemedStyles<T extends object>(styleSheet: T): T {
  return new Proxy(styleSheet, {
    get(target, property, receiver) {
      return resolveThemeValue(
        Reflect.get(target, property, receiver),
        activeThemeMode
      );
    }
  });
}

export const radius = {
  small: 4,
  medium: 6,
  large: 8
} as const;

export const spacing = {
  xsmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  xxlarge: 32
} as const;
