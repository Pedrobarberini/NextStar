import { useCallback, useState } from "react";
import { isFirebaseConfigured } from "../config/firebase";
import {
  type AppleIdentity,
  assertAppleAuthConfigured,
  signInWithAppleOnWeb
} from "../services/appleAuth";
import type { UseAppleSignInResult } from "./useAppleSignIn.types";

export function useAppleSignIn(): UseAppleSignInResult {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isAvailable = isFirebaseConfigured();

  const signInWithApple = useCallback(async (): Promise<AppleIdentity> => {
    assertAppleAuthConfigured();
    setIsSigningIn(true);

    try {
      return await signInWithAppleOnWeb();
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  return {
    isAvailable,
    isReady: isAvailable,
    isSigningIn,
    signInWithApple
  };
}
