import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEvent } from "expo";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  Expand,
  Heart,
  MessageCircle,
  MoreVertical,
  Play,
  Share2,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  UsersRound,
  UserRound
} from "lucide-react-native";
import { Alert, Animated, Easing, Image, PanResponder, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import {
  formatPlaybackTime,
  getCardPalette,
  getPointerLocationX
} from "../actions/appActions";
import { useResolvedVideoSource } from "../actions/useResolvedVideoSource";
import { BackButton } from "../components/Navigation";
import { CommentsModal } from "../components/CommentsModal";
import { FeedPostOptionsModal } from "../components/FeedPostOptionsModal";
import { ProfileAvatarImage } from "../components/ProfileAvatarImage";
import {
  ProfileListModal,
  type ProfileListItemData
} from "../components/ProfileListModal";
import { SharePostModal } from "../components/SharePostModal";
import { VideoVolumeControl } from "../components/VideoVolumeControl";
import { XOLOT_SYMBOL } from "../constants/assets";
import { FEED_TEXT_LIMIT_COMPACT, FEED_TEXT_LIMIT_WIDE, USE_CENTERED_WEB_LAYOUT } from "../constants/layout";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type {
  AppUser,
  MessageContact,
  Player,
  PostComment,
  ProfileAvatar,
  ProfileAvatarsByProfile
} from "../types";
import { CardPalette } from "../ui/types";
import {
  getPlayerContentKey,
  getPlayerContentLabel
} from "../utils/feedEngagement";

export function FeedScreen({
  activeCampaignPlayerIds,
  backLabel = "Voltar ao perfil",
  blockedProfileIds,
  commentsByPlayer,
  currentUserId,
  focusPlayerId,
  followingProfileIds,
  interestedContentKeys,
  likedPlayerIds,
  likeCountsByPlayer,
  mutedContentKeys,
  onAddComment,
  onBackToProfile,
  onDeleteComment,
  onOpenPlayer,
  onOpenTaggedUser,
  onRecordView,
  onShare,
  onToggleBlockProfile,
  onToggleFollow,
  onToggleInterest,
  onToggleLike,
  onToggleMutedContent,
  players: feedPlayers,
  profileAvatars,
  shareContacts,
  users
}: {
  activeCampaignPlayerIds: Set<string>;
  backLabel?: string;
  blockedProfileIds: Set<string>;
  commentsByPlayer: Record<string, PostComment[]>;
  currentUserId: string;
  focusPlayerId?: string | null;
  followingProfileIds: string[];
  interestedContentKeys: Set<string>;
  likedPlayerIds: Set<string>;
  likeCountsByPlayer: Record<string, number>;
  mutedContentKeys: Set<string>;
  onAddComment: (playerId: string, body: string) => boolean;
  onBackToProfile?: () => void;
  onDeleteComment: (commentId: string) => void;
  onOpenPlayer: (player: Player) => void;
  onOpenTaggedUser: (user: AppUser) => void;
  onRecordView: (playerId: string) => void;
  onShare: (
    player: Player,
    contact: MessageContact,
    message: string
  ) => void;
  onToggleBlockProfile: (player: Player) => void;
  onToggleFollow: (player: Player) => void;
  onToggleInterest: (player: Player) => void;
  onToggleLike: (player: Player) => void;
  onToggleMutedContent: (contentKey: string) => void;
  players: Player[];
  profileAvatars: ProfileAvatarsByProfile;
  shareContacts: MessageContact[];
  users: AppUser[];
}) {
  const { height } = useWindowDimensions();
  const [feedHeight, setFeedHeight] = useState(0);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [commentPlayer, setCommentPlayer] = useState<Player | null>(null);
  const [preferencePlayer, setPreferencePlayer] = useState<Player | null>(null);
  const [sharePlayer, setSharePlayer] = useState<Player | null>(null);
  const [mentionedPlayer, setMentionedPlayer] = useState<Player | null>(null);
  const feedScrollRef = useRef<ScrollView | null>(null);
  const activeFeedIndexRef = useRef(0);
  const gestureStartIndexRef = useRef(0);
  const gestureStartOffsetRef = useRef(0);
  const gestureSettledRef = useRef(false);
  const sectionOffsetsRef = useRef<Record<number, number>>({});
  const pageHeight = feedHeight || height;
  const lastFeedIndex = Math.max(feedPlayers.length - 1, 0);
  const activePlayerId = feedPlayers[activeFeedIndex]?.id;
  const mentionedUsers = useMemo(
    () =>
      (mentionedPlayer?.mentions ?? [])
        .map((mention) =>
          users.find(
            (account) =>
              account.username.toLocaleLowerCase("pt-BR") ===
              mention.toLocaleLowerCase("pt-BR")
          )
        )
        .filter((account): account is AppUser => Boolean(account)),
    [mentionedPlayer, users]
  );
  const mentionedProfiles = useMemo<ProfileListItemData[]>(
    () =>
      mentionedUsers.map((account) => ({
        avatar: profileAvatars["profile-" + account.id],
        id: account.id,
        name: account.name,
        subtitle: account.profileCompleted
          ? account.position + " | " + account.city
          : "Perfil Xolot",
        username: account.username
      })),
    [mentionedUsers, profileAvatars]
  );

  useEffect(() => {
    if (!activePlayerId) {
      return undefined;
    }

    const viewTimer = setTimeout(() => {
      onRecordView(activePlayerId);
    }, 800);

    return () => clearTimeout(viewTimer);
  }, [activePlayerId, onRecordView]);

  function activateFeedIndex(index: number) {
    const safeIndex = Math.min(Math.max(index, 0), lastFeedIndex);

    if (activeFeedIndexRef.current === safeIndex) {
      return;
    }

    activeFeedIndexRef.current = safeIndex;
    setActiveFeedIndex(safeIndex);
  }

  useEffect(() => {
    if (activeFeedIndex > lastFeedIndex) {
      activateFeedIndex(lastFeedIndex);
    }
  }, [activeFeedIndex, lastFeedIndex]);

  useEffect(() => {
    if (!focusPlayerId) {
      return;
    }

    const targetIndex = feedPlayers.findIndex(
      (player) => player.id === focusPlayerId
    );

    if (targetIndex < 0) {
      return;
    }

    activateFeedIndex(targetIndex);
    const frame = requestAnimationFrame(() => {
      const sectionOffset = sectionOffsetsRef.current[targetIndex];

      feedScrollRef.current?.scrollTo({
        animated: false,
        y: sectionOffset ?? targetIndex * pageHeight
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [feedPlayers, focusPlayerId, pageHeight]);

  function scrollToFeed(index: number) {
    const safeIndex = Math.min(Math.max(index, 0), lastFeedIndex);
    const sectionOffset = sectionOffsetsRef.current[safeIndex];

    feedScrollRef.current?.scrollTo({
      animated: true,
      y: sectionOffset ?? safeIndex * pageHeight
    });
  }

  function getNearestFeedIndex(offsetY: number) {
    let nearestIndex = activeFeedIndexRef.current;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < feedPlayers.length; index += 1) {
      const sectionOffset = sectionOffsetsRef.current[index] ?? index * pageHeight;
      const distance = Math.abs(sectionOffset - offsetY);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return Math.min(Math.max(nearestIndex, 0), lastFeedIndex);
  }

  function settleFeedGesture(offsetY: number) {
    if (!pageHeight || feedPlayers.length === 0) {
      return;
    }

    if (gestureSettledRef.current) {
      scrollToFeed(activeFeedIndexRef.current);
      return;
    }

    const delta = offsetY - gestureStartOffsetRef.current;
    const threshold = Math.max(pageHeight * 0.12, 48);
    const direction = Math.abs(delta) < threshold ? 0 : delta > 0 ? 1 : -1;
    const nextIndex = Math.min(
      Math.max(gestureStartIndexRef.current + direction, 0),
      lastFeedIndex
    );

    activateFeedIndex(nextIndex);
    gestureSettledRef.current = true;
    scrollToFeed(nextIndex);
  }

  return (
    <View
      onLayout={(event) => {
        const nextHeight = event.nativeEvent.layout.height;

        if (Math.abs(nextHeight - feedHeight) > 1) {
          setFeedHeight(nextHeight);
        }
      }}
      style={styles.feedPagerShell}
    >
      <ScrollView
        bounces={false}
        decelerationRate="normal"
        nativeID="xolot-feed-scroll"
        ref={feedScrollRef}
        onScroll={(event) => {
          activateFeedIndex(
            getNearestFeedIndex(event.nativeEvent.contentOffset.y)
          );
        }}
        onMomentumScrollEnd={(event) => {
          settleFeedGesture(event.nativeEvent.contentOffset.y);
        }}
        onScrollBeginDrag={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;

          gestureStartIndexRef.current = Math.min(
            Math.max(getNearestFeedIndex(offsetY), 0),
            lastFeedIndex
          );
          activateFeedIndex(gestureStartIndexRef.current);
          gestureStartOffsetRef.current = offsetY;
          gestureSettledRef.current = false;
        }}
        onScrollEndDrag={(event) => {
          settleFeedGesture(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.feedPager}
      >
        {feedPlayers.length === 0 ? (
          <View style={[styles.feedEmptyState, { height: pageHeight }]}>
            <View style={styles.feedEmptyStateIcon}>
              <SlidersHorizontal color={colors.primary} size={26} />
            </View>
            <Text style={styles.feedEmptyStateTitle}>
              Nenhuma publicação disponível
            </Text>
            <Text style={styles.feedEmptyStateBody}>
              Suas preferências ocultaram os posts atuais do Início.
            </Text>
          </View>
        ) : feedPlayers.map((player, index) => (
          <View
            collapsable={false}
            key={player.id}
            nativeID={`xolot-feed-section-${index}`}
            onLayout={(event) => {
              sectionOffsetsRef.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <FeedReel
              avatar={profileAvatars[player.profileId]}
              currentUserId={currentUserId}
              isFollowing={followingProfileIds.includes(player.profileId)}
              commentCount={commentsByPlayer[player.id]?.length ?? 0}
              isActive={index === activeFeedIndex && !commentPlayer}
              isLiked={likedPlayerIds.has(player.id)}
              isSponsored={activeCampaignPlayerIds.has(player.id)}
              likeCount={likeCountsByPlayer[player.id] ?? 0}
              onComments={() => setCommentPlayer(player)}
              onMore={() => setPreferencePlayer(player)}
              onOpenMentions={() => setMentionedPlayer(player)}
              onOpen={() => onOpenPlayer(player)}
              onShare={() => setSharePlayer(player)}
              onToggleLike={() => onToggleLike(player)}
              onToggleFollow={() => onToggleFollow(player)}
              palette={getCardPalette(index)}
              player={player}
              reelHeight={pageHeight}
            />
          </View>
        ))}
      </ScrollView>
      <View style={styles.feedTopNavigation}>
        {onBackToProfile ? (
          <BackButton
            accessibilityLabel={backLabel}
            onPress={onBackToProfile}
          />
        ) : null}
        <View pointerEvents="none" style={styles.feedBrandSlot}>
          <Image
            accessibilityLabel="Xolot"
            resizeMode="contain"
            source={XOLOT_SYMBOL}
            style={styles.feedReelBrandMark}
          />
        </View>
      </View>
      <FeedPostOptionsModal
        blocked={Boolean(
          preferencePlayer &&
            blockedProfileIds.has(preferencePlayer.profileId)
        )}
        canBlock={Boolean(
          preferencePlayer &&
            preferencePlayer.ownerUserId !== currentUserId &&
            preferencePlayer.profileId !== `profile-${currentUserId}`
        )}
        contentLabel={
          preferencePlayer
            ? getPlayerContentLabel(preferencePlayer)
            : "esta publicação"
        }
        interested={Boolean(
          preferencePlayer &&
            interestedContentKeys.has(getPlayerContentKey(preferencePlayer))
        )}
        muted={Boolean(
          preferencePlayer &&
            mutedContentKeys.has(getPlayerContentKey(preferencePlayer))
        )}
        onClose={() => setPreferencePlayer(null)}
        onToggleBlock={() => {
          if (preferencePlayer) {
            onToggleBlockProfile(preferencePlayer);
          }
          setPreferencePlayer(null);
        }}
        onToggleInterest={() => {
          if (preferencePlayer) {
            onToggleInterest(preferencePlayer);
          }
          setPreferencePlayer(null);
        }}
        onToggleMuted={() => {
          if (preferencePlayer) {
            onToggleMutedContent(getPlayerContentKey(preferencePlayer));
          }
          setPreferencePlayer(null);
        }}
        visible={Boolean(preferencePlayer)}
      />
      <CommentsModal
        comments={commentPlayer ? commentsByPlayer[commentPlayer.id] ?? [] : []}
        currentUserId={currentUserId}
        onAddComment={(body) =>
          commentPlayer ? onAddComment(commentPlayer.id, body) : false
        }
        onClose={() => setCommentPlayer(null)}
        onDeleteComment={onDeleteComment}
        onOpenAuthor={(authorUserId) => {
          const account = users.find((item) => item.id === authorUserId);
          setCommentPlayer(null);
          if (account) {
            onOpenTaggedUser(account);
          }
        }}
        profileAvatars={profileAvatars}
        videoId={commentPlayer?.id ?? ""}
        videoTitle={commentPlayer?.videoTitle ?? ""}
        visible={Boolean(commentPlayer)}
      />
      <SharePostModal
        contacts={shareContacts}
        onClose={() => setSharePlayer(null)}
        onShare={(contact, message) => {
          if (sharePlayer) {
            onShare(sharePlayer, contact, message);
          }
        }}
        profileAvatars={profileAvatars}
        videoId={sharePlayer?.id ?? ""}
        videoTitle={sharePlayer?.videoTitle ?? ""}
        visible={Boolean(sharePlayer)}
      />
      <ProfileListModal
        emptyBody="Os perfis marcados não estão mais disponíveis."
        emptyTitle="Nenhum perfil disponível"
        items={mentionedProfiles}
        onClose={() => setMentionedPlayer(null)}
        onSelectItem={(profile) => {
          const account = users.find((item) => item.id === profile.id);

          setMentionedPlayer(null);
          if (account) {
            onOpenTaggedUser(account);
          }
        }}
        title="Pessoas marcadas"
        visible={Boolean(mentionedPlayer)}
      />
    </View>
  );
}

function FeedReel({
  avatar,
  commentCount,
  currentUserId,
  isFollowing,
  isActive,
  isLiked,
  isSponsored,
  likeCount,
  onComments,
  onMore,
  onOpen,
  onOpenMentions,
  onShare,
  onToggleLike,
  onToggleFollow,
  palette,
  player,
  reelHeight
}: {
  avatar?: ProfileAvatar;
  commentCount: number;
  currentUserId: string;
  isFollowing: boolean;
  isActive: boolean;
  isLiked: boolean;
  isSponsored: boolean;
  likeCount: number;
  onComments: () => void;
  onMore: () => void;
  onOpen: () => void;
  onOpenMentions: () => void;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  palette: CardPalette;
  player: Player;
  reelHeight: number;
}) {
  const { width } = useWindowDimensions();
  const [isExpanded, setIsExpanded] = useState(false);
  const expansionProgress = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current;
  const isWide = !USE_CENTERED_WEB_LAYOUT && width >= 900;
  const canFollow =
    player.ownerUserId !== currentUserId &&
    player.profileId !== `profile-${currentUserId}`;
  const presentationText = player.highlight.trim();
  const textLimit = isWide ? FEED_TEXT_LIMIT_WIDE : FEED_TEXT_LIMIT_COMPACT;
  const hasMoreText = presentationText.length > textLimit;
  const visibleText =
    !isExpanded && hasMoreText
      ? `${presentationText.slice(0, textLimit).trim()}...`
      : presentationText;
  const compactPreview =
    presentationText.length > FEED_TEXT_LIMIT_COMPACT
      ? `${presentationText.slice(0, FEED_TEXT_LIMIT_COMPACT).trim()}...`
      : presentationText;
  const hasMentions = Boolean(player.mentions?.length);
  const initials = player.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const canvasHeight = isWide
    ? Math.max(540, Math.min(reelHeight - 44, 700))
    : reelHeight;
  const canvasWidth = isWide ? Math.min(width - 80, 1080) : width;

  function animateDescription(nextExpanded: boolean) {
    expansionProgress.stopAnimation();
    if (nextExpanded) setIsExpanded(true);

    Animated.timing(expansionProgress, {
      duration: nextExpanded ? 320 : 240,
      easing: nextExpanded
        ? Easing.out(Easing.cubic)
        : Easing.inOut(Easing.cubic),
      toValue: nextExpanded ? 1 : 0,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished && !nextExpanded) setIsExpanded(false);
    });
  }

  useEffect(() => {
    revealProgress.setValue(0);
    Animated.timing(revealProgress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [player.id, revealProgress]);

  useEffect(() => {
    if (!isActive) {
      expansionProgress.stopAnimation();
      expansionProgress.setValue(0);
      setIsExpanded(false);
    }
  }, [expansionProgress, isActive]);

  return (
    <View style={[styles.feedReel, { height: reelHeight }]}>
      <Animated.View
        style={[
          styles.feedReelStage,
          isWide ? styles.feedReelStageWide : null,
          { opacity: revealProgress }
        ]}
      >
        <View
          style={[
            styles.feedReelCanvas,
            isWide
              ? [
                  styles.feedReelCanvasWide,
                  {
                    flexBasis: canvasHeight,
                    flexGrow: 0,
                    flexShrink: 0,
                    height: canvasHeight,
                    width: canvasWidth
                  }
                ]
              : null
          ]}
        >
          <View style={styles.feedVideoBackground} />
          <FeedVideoBox
            isActive={isActive}
            isWide={isWide}
            palette={palette}
            player={player}
          />

          <View style={[styles.feedSocialActionRail, isWide ? styles.feedSocialActionRailWide : null]}>
            <Pressable
              accessibilityLabel={isLiked ? `Remover curtida de ${player.videoTitle}` : `Curtir ${player.videoTitle}`}
              accessibilityRole="button"
              hitSlop={5}
              onPress={onToggleLike}
              style={styles.feedSocialAction}
            >
              <View style={styles.feedSocialActionIcon}>
                <Heart color={isLiked ? colors.like : colors.onPrimary} fill={isLiked ? colors.like : "transparent"} size={25} strokeWidth={2.2} />
              </View>
              <Text style={styles.feedSocialActionCount}>{likeCount}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Ver comentários de ${player.videoTitle}`}
              accessibilityRole="button"
              hitSlop={5}
              onPress={onComments}
              style={styles.feedSocialAction}
            >
              <View style={styles.feedSocialActionIcon}>
                <MessageCircle color={colors.onPrimary} size={24} strokeWidth={2.2} />
              </View>
              <Text style={styles.feedSocialActionCount}>{commentCount}</Text>
            </Pressable>
            <Pressable accessibilityLabel={`Compartilhar ${player.videoTitle}`} accessibilityRole="button" hitSlop={5} onPress={onShare} style={styles.feedSocialAction}>
              <View style={styles.feedSocialActionIcon}>
                <Share2 color={colors.onPrimary} size={24} strokeWidth={2.2} />
              </View>
            </Pressable>
            <Pressable accessibilityLabel={`Mais opções de ${player.videoTitle}`} accessibilityRole="button" hitSlop={5} onPress={onMore} style={styles.feedSocialAction}>
              <View style={styles.feedSocialActionIcon}>
                <MoreVertical color={colors.onPrimary} size={25} strokeWidth={2.3} />
              </View>
            </Pressable>
          </View>

          <Animated.View
            style={[
              styles.feedTextOverlay,
              isWide
                ? [styles.feedTextOverlayWide, { right: Math.max(300, canvasWidth - 360) }]
                : [
                    styles.feedTextOverlayCompact,
                    {
                      minHeight: expansionProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 230] }),
                      paddingTop: expansionProgress.interpolate({ inputRange: [0, 1], outputRange: [14, 62] })
                    }
                  ]
            ]}
          >
            {!isWide && isExpanded ? (
              <Animated.View pointerEvents="none" style={[styles.feedCompactBackdropAnimation, { opacity: expansionProgress }]}>
                <BlurView experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : "none"} intensity={24} pointerEvents="none" style={styles.feedCompactBlur} tint="dark" />
                <LinearGradient colors={["rgba(5, 18, 12, 0)", "rgba(5, 18, 12, 1)"]} end={{ x: 0.5, y: 1 }} locations={[0, 1]} pointerEvents="none" start={{ x: 0.5, y: 0 }} style={styles.feedCompactGradient} />
              </Animated.View>
            ) : null}

            <View style={[styles.feedProfileRow, !isWide ? styles.feedProfileRowCompact : null]}>
              <Pressable
                accessibilityLabel={`Abrir perfil de ${player.name}`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={onOpen}
                style={({ pressed }) => [
                  styles.feedProfileButton,
                  isWide ? [styles.feedAvatar, { borderColor: palette.accent }] : styles.feedProfileButtonCompact,
                  pressed ? styles.buttonPressed : null
                ]}
              >
                {avatar ? (
                  <ProfileAvatarImage avatar={avatar} />
                ) : isWide ? (
                  <Text style={[styles.feedAvatarText, { color: palette.accent }]}>{initials}</Text>
                ) : (
                  <UserRound color={colors.onPrimary} size={20} strokeWidth={2.2} />
                )}
              </Pressable>
              <Pressable accessibilityLabel={`Abrir perfil de ${player.name}`} accessibilityRole="button" hitSlop={4} onPress={onOpen} style={styles.feedProfileTextBlock}>
                {!isWide ? (
                  <Text numberOfLines={1} style={[styles.feedSponsorLabel, styles.feedSponsorLabelCompact, { color: "rgba(255, 255, 255, 0.82)" }]}>
                    {player.username ? `${player.name} | ` : ""}{player.position} | {player.city}
                  </Text>
                ) : null}
                <Text numberOfLines={1} style={[styles.feedProfileName, !isWide ? styles.feedProfileNameCompact : null, { color: isWide ? palette.text : colors.onPrimary }]}>
                  {player.username ? `@${player.username}` : player.name}
                </Text>
                {isWide ? (
                  <Text numberOfLines={1} style={[styles.feedSponsorLabel, { color: palette.muted }]}>
                    {player.username ? `${player.name} | ` : ""}{player.position} | {player.city}
                  </Text>
                ) : null}
              </Pressable>
              {canFollow ? (
                <Pressable
                  accessibilityLabel={isFollowing ? `Deixar de seguir ${player.name}` : `Seguir ${player.name}`}
                  accessibilityRole="button"
                  onPress={onToggleFollow}
                  style={({ pressed }) => [
                    styles.feedFollowButton,
                    !isWide ? styles.feedFollowButtonCompact : null,
                    isFollowing ? styles.feedFollowButtonActive : null,
                    isFollowing && !isWide ? styles.feedFollowButtonActiveCompact : null,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  {isFollowing ? <UserCheck color={isWide ? colors.primary : colors.onPrimary} size={15} strokeWidth={2.4} /> : <UserPlus color={colors.onPrimary} size={15} strokeWidth={2.4} />}
                  <Text numberOfLines={1} style={[styles.feedFollowButtonText, isFollowing && isWide ? styles.feedFollowButtonTextActiveWide : null]}>{isFollowing ? "Seguindo" : "Seguir"}</Text>
                </Pressable>
              ) : null}
              {isWide ? (
                <View style={[styles.feedStatusPill, { borderColor: palette.border }]}>
                  <Text style={[styles.feedStatusText, { color: palette.accent }]}>{isSponsored ? "Patrocinado" : player.isDemo ? "Demonstração" : "Publicado"}</Text>
                </View>
              ) : null}
            </View>

            {isSponsored && !isWide ? (
              <Text style={{ color: "rgba(255,255,255,0.76)", fontSize: 11, fontWeight: "800", marginBottom: 4 }}>Patrocinado</Text>
            ) : null}

            {isWide ? (
              <>
                <Text numberOfLines={2} style={[styles.feedReelVideoTitle, styles.feedReelVideoTitleWide, { color: palette.text }]}>{player.videoTitle}</Text>
                <Text style={[styles.feedReelHighlight, { color: palette.text }]}>{visibleText}</Text>
                <Text numberOfLines={1} style={[styles.feedReelMeta, { color: palette.muted }]}>{player.age} anos | {player.club}</Text>
                <View style={styles.feedTagRow}>
                  {player.tags.slice(0, 3).map((tag) => (
                    <Text key={`tag-${tag}`} numberOfLines={1} style={[styles.feedTag, { borderColor: palette.border, color: palette.text }]}>#{tag}</Text>
                  ))}
                </View>
                <View style={styles.feedReadMoreRow}>
                  {hasMoreText || hasMentions ? (
                    <Pressable onPress={() => animateDescription(!isExpanded)} style={styles.feedReadMoreButton}>
                      <Text style={[styles.feedReadMoreText, { color: palette.accent }]}>{isExpanded ? "Ver menos" : "Ver mais"}</Text>
                    </Pressable>
                  ) : null}
                  {isExpanded && hasMentions ? <FeedMentionsButton color={palette.accent} count={player.mentions?.length ?? 0} onPress={onOpenMentions} /> : null}
                </View>
                <Pressable onPress={onOpen} style={({ pressed }) => [styles.feedLearnMoreButton, pressed ? styles.feedReelButtonPressed : null]}>
                  <Text style={styles.feedLearnMoreText}>Abrir perfil</Text>
                </Pressable>
              </>
            ) : !isExpanded ? (
              <View>
                <Text style={[styles.feedCompactDescription, styles.feedCompactDescriptionTitle]}>{player.videoTitle}</Text>
                <Text style={[styles.feedCompactDescription, styles.feedCompactDescriptionBody]}>
                  {compactPreview}
                  {(hasMoreText || hasMentions) ? (
                    <Text accessibilityRole="button" onPress={() => animateDescription(true)} style={styles.feedCompactInlineAction}>{"  "}mais</Text>
                  ) : null}
                </Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.feedCompactExpandedContent,
                  {
                    opacity: expansionProgress,
                    transform: [{ translateY: expansionProgress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }]
                  }
                ]}
              >
                <Text style={[styles.feedCompactDescription, styles.feedCompactDescriptionTitle]}>{player.videoTitle}</Text>
                <Text style={[styles.feedCompactDescription, styles.feedCompactDescriptionBody]}>{presentationText}</Text>
                <Text style={styles.feedCompactExpandedMeta}>{player.age} anos | {player.club}</Text>
                {player.tags.length > 0 ? (
                  <View style={styles.feedCompactHashtagRow}>
                    {player.tags.slice(0, 4).map((tag) => <Text key={tag} style={styles.feedCompactHashtag}>#{tag}</Text>)}
                  </View>
                ) : null}
                <View style={styles.feedCompactExpandedActions}>
                  {hasMentions ? <FeedMentionsButton compact color={colors.onPrimary} count={player.mentions?.length ?? 0} onPress={onOpenMentions} /> : <View />}
                  <Pressable accessibilityLabel="Recolher descrição" accessibilityRole="button" hitSlop={8} onPress={() => animateDescription(false)} style={styles.feedCompactTextButton}>
                    <Text style={styles.feedCompactTextButtonLabel}>menos</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
function FeedMentionsButton({
  color,
  compact = false,
  count,
  onPress
}: {
  color: string;
  compact?: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        "Ver " + count + (count === 1 ? " pessoa marcada" : " pessoas marcadas")
      }
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.feedMentionsButton,
        compact ? styles.feedMentionsButtonCompact : null
      ]}
    >
      <UsersRound color={color} size={18} strokeWidth={2.3} />
      <Text style={[styles.feedMentionsCount, { color }]}>{count}</Text>
    </Pressable>
  );
}

function FeedVideoBox({
  isActive,
  isWide,
  palette,
  player
}: {
  isActive: boolean;
  isWide: boolean;
  palette: CardPalette;
  player: Player;
}) {
  return (
    <View
      style={[
        styles.feedVideoBox,
        isWide ? styles.feedVideoBoxWide : styles.feedVideoBoxCompact,
        { backgroundColor: palette.media, borderColor: palette.border }
      ]}
    >
      {player.mediaType === "image" ? (
        <FeedImagePlayback uri={player.videoUri} />
      ) : (
        <FeedVideoPlayback
          accent={palette.accent}
          caption={player.videoTitle}
          durationLabel={player.videoLength}
          hasAudio={player.hasAudio !== false}
          isActive={isActive}
          isWide={isWide}
          onAccent={palette.onAccent}
          trackColor={palette.progressTrack}
          uri={player.videoUri}
        />
      )}
    </View>
  );
}
function FeedImagePlayback({ uri }: { uri: string | number }) {
  const resolvedImage = useResolvedVideoSource(uri);

  if (!resolvedImage.source) {
    return (
      <View style={[styles.feedVideoPlayback, styles.videoUnavailableState]}>
        <Text style={styles.videoUnavailableTitle}>
          {resolvedImage.status === "loading"
            ? "Carregando foto..."
            : "Foto indisponível"}
        </Text>
        {resolvedImage.status === "unavailable" ? (
          <Text style={styles.videoUnavailableBody}>
            O arquivo temporário expirou. Publique esta foto novamente.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.feedVideoPlayback}>
      <Image
        accessibilityLabel="Foto da publicação"
        resizeMode="cover"
        source={
          typeof resolvedImage.source === "number"
            ? resolvedImage.source
            : { uri: resolvedImage.source }
        }
        style={styles.feedVideoMedia}
      />
    </View>
  );
}

type FeedVideoPlaybackProps = {
  accent: string;
  caption: string;
  durationLabel: string;
  hasAudio: boolean;
  isActive: boolean;
  isWide: boolean;
  onAccent: string;
  trackColor: string;
  uri: string | number;
};

function FeedVideoPlayback(props: FeedVideoPlaybackProps) {
  const resolvedVideo = useResolvedVideoSource(props.uri);

  if (!resolvedVideo.source) {
    return (
      <View style={[styles.feedVideoPlayback, styles.videoUnavailableState]}>
        <Text style={styles.videoUnavailableTitle}>
          {resolvedVideo.status === "loading"
            ? "Carregando vídeo..."
            : "Video indisponível"}
        </Text>
        {resolvedVideo.status === "unavailable" ? (
          <Text style={styles.videoUnavailableBody}>
            O arquivo temporário expirou. O atleta precisa reenviar este vídeo.
          </Text>
        ) : null}
      </View>
    );
  }

  return <ResolvedFeedVideoPlayback {...props} uri={resolvedVideo.source} />;
}

function ResolvedFeedVideoPlayback({
  accent,
  caption,
  durationLabel,
  hasAudio,
  isActive,
  isWide,
  onAccent,
  trackColor,
  uri
}: FeedVideoPlaybackProps) {
  const videoViewRef = useRef<VideoView | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [seekTrackWidth, setSeekTrackWidth] = useState(0);
  const [volume, setVolume] = useState(0);
  const videoPlayer = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.timeUpdateEventInterval = 0.1;
  });
  const { isPlaying } = useEvent(videoPlayer, "playingChange", {
    isPlaying: videoPlayer.playing
  });
  const { muted } = useEvent(videoPlayer, "mutedChange", {
    muted: videoPlayer.muted
  });
  const { status: playerStatus } = useEvent(videoPlayer, "statusChange", {
    status: videoPlayer.status
  });
  const { currentTime } = useEvent(videoPlayer, "timeUpdate", {
    bufferedPosition: videoPlayer.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    currentTime: videoPlayer.currentTime
  });
  const playbackDuration =
    playerStatus === "readyToPlay" &&
    Number.isFinite(videoPlayer.duration) &&
    videoPlayer.duration > 0
      ? videoPlayer.duration
      : 0;
  const safeCurrentTime = Number.isFinite(playbackTime)
    ? Math.min(Math.max(playbackTime, 0), playbackDuration || playbackTime)
    : 0;
  const playbackProgress =
    playbackDuration > 0 ? safeCurrentTime / playbackDuration : 0;
  const totalTimeLabel =
    durationLabel || formatPlaybackTime(Math.ceil(playbackDuration));
  const thumbOffset =
    seekTrackWidth > 12
      ? Math.min(
          Math.max(playbackProgress * seekTrackWidth, 6),
          seekTrackWidth - 6
        )
      : 0;
  const videoPlayerRef = useRef(videoPlayer);
  const playbackDurationRef = useRef(playbackDuration);
  const seekTrackWidthRef = useRef(seekTrackWidth);
  const seekToTimeRef = useRef<(targetTime: number) => number>(() => 0);
  const seekToOffsetRef = useRef<(offsetX: number) => number>(() => 0);

  videoPlayerRef.current = videoPlayer;
  playbackDurationRef.current = playbackDuration;
  seekTrackWidthRef.current = seekTrackWidth;
  seekToTimeRef.current = (targetTime: number) => {
    const duration = playbackDurationRef.current;

    if (duration <= 0) {
      return 0;
    }

    const nextTime = Math.min(Math.max(targetTime, 0), duration);
    setPlaybackTime(nextTime);
    videoPlayerRef.current.currentTime = nextTime;
    return nextTime;
  };
  seekToOffsetRef.current = (offsetX: number) => {
    const width = seekTrackWidthRef.current;
    const duration = playbackDurationRef.current;

    if (width <= 0 || duration <= 0) {
      return 0;
    }

    const progress = Math.min(Math.max(offsetX / width, 0), 1);
    return seekToTimeRef.current(progress * duration);
  };
  const seekPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        const locationX = getPointerLocationX(event.nativeEvent);

        if (locationX !== null) {
          seekToOffsetRef.current(locationX);
        }
      },
      onPanResponderMove: (event) => {
        const locationX = getPointerLocationX(event.nativeEvent);

        if (locationX !== null) {
          seekToOffsetRef.current(locationX);
        }
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onStartShouldSetPanResponder: () => false
    })
  ).current;
  useEffect(() => {
    if (Number.isFinite(currentTime)) {
      setPlaybackTime(currentTime);
    }
  }, [currentTime]);

  useEffect(() => {
    if (isActive) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }

    return () => videoPlayer.pause();
  }, [isActive, videoPlayer]);

  function togglePlayback() {
    if (isPlaying) {
      videoPlayer.pause();
      return;
    }

    videoPlayer.play();
  }

  function openFullscreen() {
    videoViewRef.current?.enterFullscreen().catch(() => {
      Alert.alert("Tela cheia indisponível", "Tente abrir o vídeo novamente.");
    });
  }

  return (
    <View style={styles.feedVideoPlayback}>
      <VideoView
        allowsFullscreen
        contentFit="cover"
        nativeControls={false}
        player={videoPlayer}
        playsInline
        ref={videoViewRef}
        style={styles.feedVideoMedia}
        surfaceType="textureView"
      />
      <Pressable
        accessibilityLabel={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        accessibilityRole="button"
        onPress={togglePlayback}
        style={styles.feedVideoTapTarget}
      >
        {!isPlaying ? (
          <View
            style={[
              styles.feedVideoPlayCircle,
              styles.feedVideoPlaybackPlay,
              { backgroundColor: accent }
            ]}
          >
            <Play color={onAccent} fill={onAccent} size={24} />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.feedVideoFloatingControls}>
        <Pressable
          accessibilityLabel="Abrir vídeo em tela cheia"
          accessibilityRole="button"
          onPress={openFullscreen}
          style={styles.feedVideoControlButton}
        >
          <Expand color="#FFFFFF" size={20} />
        </Pressable>
        {hasAudio ? (
          <VideoVolumeControl
            active={isActive}
            muted={muted}
            onChange={(targetVolume) => {
              const nextVolume = Math.min(Math.max(targetVolume, 0), 1);

              setVolume(nextVolume);
              videoPlayer.volume = nextVolume;
              videoPlayer.muted = nextVolume <= 0;
            }}
            volume={volume}
          />
        ) : null}
      </View>
      {isWide ? (
        <View pointerEvents="none" style={styles.feedVideoCaptionStrip}>
          <Text
            numberOfLines={1}
            style={[styles.feedVideoCaption, { color: colors.onPrimary }]}
          >
            {caption}
          </Text>
          <Text style={[styles.feedVideoDuration, { color: colors.onPrimary }]}>
            {formatPlaybackTime(safeCurrentTime)} / {totalTimeLabel}
          </Text>
        </View>
      ) : null}
      <View
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          seekTrackWidthRef.current = nextWidth;
          setSeekTrackWidth(nextWidth);
        }}
        style={[
          styles.feedVideoSeekControl,
          !isWide ? styles.feedVideoSeekControlCompact : null
        ]}
        {...seekPanResponder.panHandlers}
      >
        <Pressable
          accessibilityActions={[
            { label: "Avancar 5 segundos", name: "increment" },
            { label: "Voltar 5 segundos", name: "decrement" }
          ]}
          accessibilityLabel="Posição do vídeo"
          accessibilityRole="adjustable"
          accessibilityValue={{
            max: Math.max(0, Math.round(playbackDuration)),
            min: 0,
            now: Math.max(0, Math.round(safeCurrentTime)),
            text: `${formatPlaybackTime(safeCurrentTime)} de ${totalTimeLabel}`
          }}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") {
              seekToTimeRef.current(safeCurrentTime + 5);
            }

            if (event.nativeEvent.actionName === "decrement") {
              seekToTimeRef.current(safeCurrentTime - 5);
            }
          }}
          onPress={(event) => {
            const locationX = getPointerLocationX(event.nativeEvent);

            if (locationX !== null) {
              seekToOffsetRef.current(locationX);
            }
          }}
          style={styles.feedVideoSeekPressable}
        >
          <View
            pointerEvents="none"
            style={[
              styles.feedVideoScrubberTrack,
              { backgroundColor: trackColor }
            ]}
          >
            <View
              style={[
                styles.feedVideoScrubberFill,
                {
                  backgroundColor: accent,
                  width: `${playbackProgress * 100}%`
                }
              ]}
            />
          </View>
          <View
            pointerEvents="none"
            style={[styles.feedVideoScrubberThumb, { left: thumbOffset }]}
          />
        </Pressable>
      </View>
    </View>
  );
}
