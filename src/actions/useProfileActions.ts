import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  getSafeFirebaseAvatarMessage,
  saveFirebaseAvatar,
  subscribeFirebaseProfileMedia
} from "../services/firebaseAvatarService";
import {
  loadProfileAvatars,
  saveProfileAvatars
} from "../services/profileStorage";
import type {
  AppUser,
  ProfileAvatar,
  ProfileAvatarsByProfile
} from "../types";

export function useProfileActions(user: AppUser | null) {
  const [profileAvatars, setProfileAvatars] =
    useState<ProfileAvatarsByProfile>({});
  const [isProfileStateLoaded, setIsProfileStateLoaded] = useState(false);
  const avatarSaveQueueRef = useRef(Promise.resolve());
  const uploadedAvatarBySourceRef = useRef(new Map<string, ProfileAvatar>());

  useEffect(() => {
    let isMounted = true;

    loadProfileAvatars().then((storedAvatars) => {
      if (!isMounted) {
        return;
      }

      setProfileAvatars(storedAvatars);
      setIsProfileStateLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeFirebaseProfileMedia(
      (remoteAvatars) => {
        setProfileAvatars((current) => ({
          ...current,
          ...remoteAvatars
        }));
      },
      () => undefined
    );
  }, [user?.id]);

  useEffect(() => {
    if (!isProfileStateLoaded) {
      return;
    }

    saveProfileAvatars(profileAvatars).catch(() => undefined);
  }, [isProfileStateLoaded, profileAvatars]);

  function setProfileAvatar(profileId: string, avatar: ProfileAvatar | null) {
    if (!profileId) {
      return;
    }

    setProfileAvatars((current) => {
      if (avatar?.uri.trim()) {
        return { ...current, [profileId]: avatar };
      }

      const nextAvatars = { ...current };
      delete nextAvatars[profileId];
      return nextAvatars;
    });

    const ownProfileId = user ? `profile-${user.id}` : "";
    if (!user || profileId !== ownProfileId || !avatar?.uri.trim()) {
      return;
    }

    const sourceURI = avatar.uri;
    avatarSaveQueueRef.current = avatarSaveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const uploadedAvatar = uploadedAvatarBySourceRef.current.get(sourceURI);
        const avatarToSave = uploadedAvatar
          ? { ...avatar, uri: uploadedAvatar.uri }
          : avatar;
        const remoteAvatar = await saveFirebaseAvatar(user.id, avatarToSave);

        uploadedAvatarBySourceRef.current.set(sourceURI, remoteAvatar);
        setProfileAvatars((current) => ({
          ...current,
          [profileId]: remoteAvatar
        }));
      })
      .catch((error) => {
        Alert.alert(
          "Foto não salva",
          getSafeFirebaseAvatarMessage(error)
        );
      });
  }

  return { profileAvatars, setProfileAvatar };
}
