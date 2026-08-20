import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  getFirebaseFirestore,
  getFirebaseFunctions
} from "../config/firebase";
import type { TagCatalogEntry } from "../types";
import { normalizeTagKey, normalizeTagLabel } from "../utils/tagCatalog";

const TAG_CATALOG_COLLECTION = "tagCatalog";
const MAX_CATALOG_TAGS = 200;

function normalizeCatalogDocument(
  id: string,
  value: Record<string, unknown>
): TagCatalogEntry | null {
  const key = normalizeTagKey(id);
  const label = normalizeTagLabel(
    typeof value.label === "string" ? value.label : id
  );
  if (!key || key !== id || !label) return null;
  return {
    creatorCount:
      typeof value.creatorCount === "number" ? value.creatorCount : 0,
    key,
    label,
    postCount: typeof value.postCount === "number" ? value.postCount : 0
  };
}

export function subscribeFirebaseTagCatalog(
  onTags: (tags: TagCatalogEntry[]) => void,
  onError?: (error: Error) => void
) {
  const catalogQuery = query(
    collection(getFirebaseFirestore(), TAG_CATALOG_COLLECTION),
    orderBy("creatorCount", "desc"),
    limit(MAX_CATALOG_TAGS)
  );
  return onSnapshot(
    catalogQuery,
    (snapshot) => {
      onTags(
        snapshot.docs
          .map((item) => normalizeCatalogDocument(item.id, item.data()))
          .filter((item): item is TagCatalogEntry => Boolean(item))
      );
    },
    (error) => onError?.(error)
  );
}

export async function ensureFirebaseTagCatalogEntry(label: string) {
  const ensureTag = httpsCallable<
    { label: string },
    TagCatalogEntry
  >(getFirebaseFunctions(), "ensureTagCatalogEntry");
  return (await ensureTag({ label })).data;
}