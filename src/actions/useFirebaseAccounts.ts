import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "../config/firebase";
import {
  hasFirebaseAccount,
  isGoogleFirebaseUser,
  observeFirebaseAuth,
  signOutFirebaseSession
} from "../services/firebaseAccountService";
import {
  loadFirebaseAppUser,
  subscribeFirebaseProfiles
} from "../services/firebaseProfileService";
import type { AppUser } from "../types";

const ACCOUNT_CREATION_RETRIES = 12;
const ACCOUNT_CREATION_RETRY_MS = 500;

function wait(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function waitForFirebaseAccount(uid: string) {
  for (let attempt = 0; attempt < ACCOUNT_CREATION_RETRIES; attempt += 1) {
    if (await hasFirebaseAccount(uid)) {
      return true;
    }

    if (attempt < ACCOUNT_CREATION_RETRIES - 1) {
      await wait(ACCOUNT_CREATION_RETRY_MS);
    }
  }

  return false;
}

export function useFirebaseAccounts() {
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [sessionError, setSessionError] = useState("");
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsSessionLoaded(true);
      setSessionError("Firebase não configurado neste ambiente.");
      return;
    }

    let isMounted = true;
    let authGeneration = 0;
    let unsubscribeProfiles: (() => void) | null = null;

    const unsubscribeAuth = observeFirebaseAuth((firebaseUser) => {
      authGeneration += 1;
      const currentGeneration = authGeneration;
      unsubscribeProfiles?.();
      unsubscribeProfiles = null;

      if (!firebaseUser || !firebaseUser.emailVerified) {
        if (isMounted) {
          setUser(null);
          setRegisteredUsers([]);
          setSessionError("");
          setIsSessionLoaded(true);
        }
        return;
      }

      loadFirebaseAppUser(firebaseUser)
        .then(async (appUser) => ({
          appUser,
          hasAccount:
            appUser.profileCompleted ||
            (await waitForFirebaseAccount(firebaseUser.uid))
        }))
        .then(({ hasAccount, appUser }) => {
          if (!isMounted || currentGeneration !== authGeneration) {
            return;
          }

          if (!hasAccount) {
            if (!isGoogleFirebaseUser(firebaseUser)) {
              void signOutFirebaseSession();
            }
            setUser(null);
            setRegisteredUsers([]);
            setSessionError(
              isGoogleFirebaseUser(firebaseUser)
                ? ""
                : "A conta autenticada não possui cadastro Xolot."
            );
            setIsSessionLoaded(true);
            return;
          }

          setUser(appUser);
          setSessionError("");
          setRegisteredUsers(appUser.profileCompleted ? [appUser] : []);
          setIsSessionLoaded(true);

          unsubscribeProfiles = subscribeFirebaseProfiles(
            firebaseUser,
            (profiles) => {
              if (!isMounted || currentGeneration !== authGeneration) {
                return;
              }

              setRegisteredUsers(profiles);
              const refreshedCurrentUser = profiles.find(
                (profile) => profile.id === firebaseUser.uid
              );
              if (refreshedCurrentUser) {
                setUser(refreshedCurrentUser);
              }
            },
            () => {
              if (isMounted) {
                setSessionError("Não foi possível sincronizar os perfis agora.");
              }
            }
          );
        })
        .catch(() => {
          if (!isMounted || currentGeneration !== authGeneration) {
            return;
          }

          setUser(null);
          setRegisteredUsers([]);
          setSessionError("Não foi possível restaurar a sessão com segurança.");
          setIsSessionLoaded(true);
        });
    });

    return () => {
      isMounted = false;
      authGeneration += 1;
      unsubscribeProfiles?.();
      unsubscribeAuth();
    };
  }, []);

  return {
    isSessionLoaded,
    registeredUsers,
    sessionError,
    setRegisteredUsers,
    setUser,
    user
  };
}