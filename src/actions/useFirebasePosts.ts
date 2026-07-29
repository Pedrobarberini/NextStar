import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { subscribeFirebasePosts } from "../services/firebasePostService";
import type { AppUser, VideoSubmission } from "../types";

export function useFirebasePosts(
  user: AppUser | null,
  setSubmissions: Dispatch<SetStateAction<VideoSubmission[]>>
) {
  const [loadedUserId, setLoadedUserId] = useState("");
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoadedUserId("");
      setPostsError("");
      return;
    }

    let isMounted = true;
    setPostsError("");

    const unsubscribe = subscribeFirebasePosts(
      (posts) => {
        if (!isMounted) {
          return;
        }
        setSubmissions(posts);
        setLoadedUserId(user.id);
      },
      () => {
        if (!isMounted) {
          return;
        }
        setPostsError("Não foi possível sincronizar as publicações agora.");
        setLoadedUserId(user.id);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setSubmissions, user?.id]);

  return {
    isPostsLoaded: !user || loadedUserId === user.id,
    postsError
  };
}
