import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { isFirebaseMediaEnabled } from "../config/firebase";
import {
  getSafeFirebasePostSyncMessage,
  subscribeFirebasePosts
} from "../services/firebasePostService";
import type { AppUser, VideoSubmission } from "../types";

export function useFirebasePosts(
  user: AppUser | null,
  setSubmissions: Dispatch<SetStateAction<VideoSubmission[]>>,
  isLocalStateLoaded: boolean
) {
  const [loadedUserId, setLoadedUserId] = useState("");
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    if (!isLocalStateLoaded) {
      return;
    }

    if (!user || !isFirebaseMediaEnabled()) {
      setLoadedUserId("");
      setPostsError("");
      if (!user) {
        setSubmissions([]);
      }
      return;
    }

    let isMounted = true;
    setLoadedUserId("");
    setPostsError("");
    setSubmissions([]);

    const unsubscribe = subscribeFirebasePosts(
      (posts) => {
        if (!isMounted) {
          return;
        }
        setSubmissions(posts);
        setLoadedUserId(user.id);
      },
      (error) => {
        if (!isMounted) {
          return;
        }
        setSubmissions([]);
        setPostsError(getSafeFirebasePostSyncMessage(error));
        setLoadedUserId(user.id);
      },
      (warning) => {
        if (isMounted) {
          setPostsError(warning.message);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isLocalStateLoaded, setSubmissions, user?.id]);

  return {
    isPostsLoaded:
      !user || !isFirebaseMediaEnabled() || loadedUserId === user.id,
    postsError
  };
}
