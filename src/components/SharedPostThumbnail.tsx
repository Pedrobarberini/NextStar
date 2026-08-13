import React, { useEffect } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { ImageIcon, Play } from "lucide-react-native";
import { Image, Text, View } from "react-native";
import { useResolvedVideoSource } from "../actions/useResolvedVideoSource";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type { Player, SubmissionMediaType } from "../types";

export function SharedPostThumbnail({
  authorName,
  mediaType,
  player,
  title
}: {
  authorName: string;
  mediaType: SubmissionMediaType;
  player?: Player;
  title: string;
}) {
  return (
    <View style={styles.sharedPostMessageThumbnail}>
      {player ? (
        <ResolvedSharedPostThumbnail
          mediaType={mediaType}
          uri={player.videoUri}
        />
      ) : (
        <SharedPostThumbnailFallback mediaType={mediaType} />
      )}
      <View pointerEvents="none" style={styles.sharedPostMessageThumbnailOverlay}>
        <Text numberOfLines={2} style={styles.sharedPostMessageOverlayTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.sharedPostMessageOverlayAuthor}>
          {authorName}
        </Text>
      </View>
    </View>
  );
}

function ResolvedSharedPostThumbnail({
  mediaType,
  uri
}: {
  mediaType: SubmissionMediaType;
  uri: string | number;
}) {
  const resolvedMedia = useResolvedVideoSource(uri);

  if (!resolvedMedia.source) {
    return <SharedPostThumbnailFallback mediaType={mediaType} />;
  }

  if (mediaType === "image") {
    return (
      <Image
        accessibilityLabel="Foto compartilhada"
        resizeMode="cover"
        source={
          typeof resolvedMedia.source === "number"
            ? resolvedMedia.source
            : { uri: resolvedMedia.source }
        }
        style={styles.sharedPostMessageThumbnailMedia}
      />
    );
  }

  return <SharedPostVideoThumbnail uri={resolvedMedia.source} />;
}

function SharedPostVideoThumbnail({ uri }: { uri: string | number }) {
  const thumbnailPlayer = useVideoPlayer(uri);

  useEffect(() => {
    thumbnailPlayer.pause();
  }, [thumbnailPlayer]);

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={thumbnailPlayer}
      pointerEvents="none"
      style={styles.sharedPostMessageThumbnailMedia}
      surfaceType="textureView"
    />
  );
}

function SharedPostThumbnailFallback({
  mediaType
}: {
  mediaType: SubmissionMediaType;
}) {
  const color = colors.onPrimary;

  return (
    <View style={styles.sharedPostMessageThumbnailFallback}>
      {mediaType === "image" ? (
        <ImageIcon color={color} size={18} />
      ) : (
        <Play color={color} fill={color} size={17} />
      )}
    </View>
  );
}
