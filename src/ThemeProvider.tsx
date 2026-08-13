import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getThemeColors,
  normalizeThemeMode,
  setActiveThemeMode,
  type ThemeMode
} from "./theme";

const THEME_STORAGE_KEY = "@xolot/theme-mode-v1";

type ThemeContextValue = {
  setThemeMode: (mode: ThemeMode) => void;
  themeMode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  setActiveThemeMode(themeMode);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (isMounted) {
          setThemeModeState(normalizeThemeMode(storedMode));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const palette = getThemeColors(themeMode);
    document.documentElement.style.backgroundColor = palette.background;
    document.documentElement.style.colorScheme = themeMode;
    document.body.style.backgroundColor = palette.background;
  }, [themeMode]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      setThemeMode(mode) {
        setThemeModeState(mode);
        void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      },
      themeMode
    }),
    [themeMode]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
