import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FirebaseApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";

type ReactNativeAuthModule = typeof FirebaseAuth & {
  getReactNativePersistence: (
    storage: typeof AsyncStorage
  ) => FirebaseAuth.Persistence;
};

export function initializeFirebaseAuth(app: FirebaseApp): FirebaseAuth.Auth {
  const nativeAuth = FirebaseAuth as ReactNativeAuthModule;

  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: nativeAuth.getReactNativePersistence(AsyncStorage)
    });
  } catch {
    return FirebaseAuth.getAuth(app);
  }
}