import type { AppleIdentity } from "../services/appleAuth";

export type UseAppleSignInResult = {
  isAvailable: boolean;
  isReady: boolean;
  isSigningIn: boolean;
  signInWithApple: () => Promise<AppleIdentity>;
};
