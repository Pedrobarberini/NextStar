import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useTheme } from "../ThemeProvider";
import { colors } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function useExpoBoot() {
  const { themeMode } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [themeMode]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
}
