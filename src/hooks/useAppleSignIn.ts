import { useCallback } from "react";
import {
  AppleAuthConfigurationError,
  type AppleIdentity
} from "../services/appleAuth";
import type { UseAppleSignInResult } from "./useAppleSignIn.types";

export function useAppleSignIn(): UseAppleSignInResult {
  const signInWithApple = useCallback(async (): Promise<AppleIdentity> => {
    throw new AppleAuthConfigurationError(
      "O login Apple está disponível no app web. O suporte ao build nativo iOS será ativado em uma etapa própria."
    );
  }, []);

  return {
    isAvailable: false,
    isReady: false,
    isSigningIn: false,
    signInWithApple
  };
}
