import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ensureFirebaseTagCatalogEntry,
  subscribeFirebaseTagCatalog
} from "../services/firebaseTagCatalogService";
import type { AppUser, TagCatalogEntry, VideoSubmission } from "../types";
import { PROFILE_INTEREST_OPTIONS } from "../utils/profileSuggestions";
import { mergeTagCatalog } from "../utils/tagCatalog";

export function useFirebaseTagCatalog(
  user: AppUser | null,
  submissions: VideoSubmission[]
) {
  const [remoteTags, setRemoteTags] = useState<TagCatalogEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setRemoteTags([]);
      return;
    }
    return subscribeFirebaseTagCatalog(setRemoteTags, () => setRemoteTags([]));
  }, [user?.id]);

  const tagCatalog = useMemo(
    () => mergeTagCatalog(remoteTags, submissions, PROFILE_INTEREST_OPTIONS),
    [remoteTags, submissions]
  );

  const ensureTag = useCallback(async (label: string) => {
    const entry = await ensureFirebaseTagCatalogEntry(label);
    setRemoteTags((current) => mergeTagCatalog([...current, entry], []));
    return entry;
  }, []);

  return { ensureTag, tagCatalog };
}