import React from "react";
import { Image, SafeAreaView, StatusBar, View } from "react-native";
import { BrandLaunchScreen, ScreenBackdrop } from "../components/AppShell";
import { XOLOT_WORDMARK } from "../constants/assets";
import { AccountSetupModal } from "../screens/AccountSetupScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { styles } from "../styles/appStyles";
import { useTheme } from "../ThemeProvider";
import { colors } from "../theme";
import type { AccountProfile, AppUser, ProfileAvatar } from "../types";

type BrandLaunchOverlayProps = {
  isVisible: boolean;
  onFinish: () => void;
};

type LoggedOutAppShellProps = BrandLaunchOverlayProps & {
  onComplete: (user: AppUser) => void;
};

type AccountSetupGateProps = BrandLaunchOverlayProps & {
  accounts: AppUser[];
  avatar?: ProfileAvatar;
  onSave: (profile: AccountProfile) => Promise<boolean> | boolean;
  onChangeAvatar: (avatar: ProfileAvatar) => void;
  onSignOut: () => void;
  user: AppUser;
};

function AppStatusBar() {
  const { themeMode } = useTheme();

  return (
    <StatusBar
      backgroundColor={colors.background}
      barStyle={themeMode === "dark" ? "light-content" : "dark-content"}
    />
  );
}

export function BrandLaunchOverlay({
  isVisible,
  onFinish
}: BrandLaunchOverlayProps) {
  return isVisible ? <BrandLaunchScreen onFinish={onFinish} /> : null;
}

export function LoadingAppShell({
  isVisible,
  onFinish
}: BrandLaunchOverlayProps) {
  return (
    <View style={styles.appRoot}>
      <SafeAreaView style={styles.safeArea}>
        <AppStatusBar />
      </SafeAreaView>
      <BrandLaunchOverlay isVisible={isVisible} onFinish={onFinish} />
    </View>
  );
}

export function LoggedOutAppShell({
  isVisible,
  onComplete,
  onFinish
}: LoggedOutAppShellProps) {
  return (
    <View style={styles.appRoot}>
      <SafeAreaView style={styles.safeArea}>
        <AppStatusBar />
        <AuthScreen onComplete={onComplete} />
      </SafeAreaView>
      <BrandLaunchOverlay isVisible={isVisible} onFinish={onFinish} />
    </View>
  );
}

export function AccountSetupGate({
  accounts,
  avatar,
  isVisible,
  onFinish,
  onSave,
  onChangeAvatar,
  onSignOut,
  user
}: AccountSetupGateProps) {
  return (
    <View style={styles.appRoot}>
      <SafeAreaView style={styles.safeArea}>
        <AppStatusBar />
        <ScreenBackdrop />
        <View style={styles.accountSetupModalBrand}>
          <Image
            accessibilityLabel="Logo Xolot"
            resizeMode="contain"
            source={XOLOT_WORDMARK}
            style={styles.accountSetupModalBrandLogo}
          />
        </View>
        <AccountSetupModal
          avatar={avatar}
          accounts={accounts}
          onSave={onSave}
          onChangeAvatar={onChangeAvatar}
          onSignOut={onSignOut}
          user={user}
          visible
        />
      </SafeAreaView>
      <BrandLaunchOverlay isVisible={isVisible} onFinish={onFinish} />
    </View>
  );
}
