export function addProfileVideoSelection(
  selectedVideoIds: string[],
  videoId: string
) {
  return selectedVideoIds.includes(videoId)
    ? selectedVideoIds
    : [...selectedVideoIds, videoId];
}

export function toggleProfileVideoSelection(
  selectedVideoIds: string[],
  videoId: string
) {
  return selectedVideoIds.includes(videoId)
    ? selectedVideoIds.filter((selectedId) => selectedId !== videoId)
    : [...selectedVideoIds, videoId];
}

type ProfileVideoReference = {
  id: string;
  sourceId?: string;
};

export function getProfileVideoVisibilityIds(video: ProfileVideoReference) {
  return video.sourceId && video.sourceId !== video.id
    ? [video.id, video.sourceId]
    : [video.id];
}

export function isProfileVideoHidden(
  hiddenVideoIds: Set<string>,
  video: ProfileVideoReference
) {
  return getProfileVideoVisibilityIds(video).some((videoId) =>
    hiddenVideoIds.has(videoId)
  );
}
