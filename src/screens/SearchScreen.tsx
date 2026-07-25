import React, { useMemo, useState } from "react";
import { BadgeCheck, ChevronRight, Search, X } from "lucide-react-native";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ProfileAvatarImage } from "../components/ProfileAvatarImage";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type {
  AppUser,
  Player,
  ProfessionalSettingsByUser,
  ProfileAvatarsByProfile
} from "../types";
import { getProfessionalCategoryLabel } from "../utils/professional";

type SearchProfile = {
  id: string;
  meta: string;
  name: string;
  player?: Player;
  professionalLabel?: string;
  profileId: string;
  searchableText: string;
  user?: AppUser;
  username?: string;
};

export function SearchScreen({
  onOpenPlayer,
  onOpenUser,
  players,
  professionalSettingsByUser,
  profileAvatars,
  users
}: {
  onOpenPlayer: (player: Player) => void;
  onOpenUser: (user: AppUser) => void;
  players: Player[];
  professionalSettingsByUser: ProfessionalSettingsByUser;
  profileAvatars: ProfileAvatarsByProfile;
  users: AppUser[];
}) {
  const [query, setQuery] = useState("");
  const profiles = useMemo(() => {
    const uniquePlayers = Array.from(
      new Map(players.map((player) => [player.profileId, player])).values()
    );
    const userAccounts = users.filter((account) => account.role === "Usuário");
    const userIds = new Set(userAccounts.map((account) => account.id));
    const registeredProfiles: SearchProfile[] = userAccounts.map((account) => {
      const player = uniquePlayers.find((item) => item.ownerUserId === account.id);
      const professionalSettings = professionalSettingsByUser[account.id];
      const meta = account.profileCompleted
        ? `${account.position} | ${account.city}`
        : player
          ? `${player.position} | ${player.city}`
          : "Usuário Xolot | Sem publicações";

      return {
        id: `account-${account.id}`,
        meta,
        name: player?.name ?? account.name,
        player,
        professionalLabel: professionalSettings?.enabled
          ? getProfessionalCategoryLabel(professionalSettings.category)
          : undefined,
        profileId: player?.profileId ?? `profile-${account.id}`,
        searchableText: [
          account.name,
          account.username,
          `@${account.username}`,
          account.bio,
          account.position,
          account.city,
          account.club,
          professionalSettings?.enabled
            ? getProfessionalCategoryLabel(professionalSettings.category)
            : "",
          player?.name,
          player?.position,
          player?.city,
          player?.club
        ].filter(Boolean).join(" "),
        user: account,
        username: account.username
      };
    });
    const standaloneProfiles: SearchProfile[] = uniquePlayers
      .filter((player) => !player.ownerUserId || !userIds.has(player.ownerUserId))
      .map((player) => ({
        id: `player-${player.profileId}`,
        meta: `${player.position} | ${player.city}`,
        name: player.name,
        player,
        profileId: player.profileId,
        searchableText: [
          player.name,
          player.username,
          player.position,
          player.city,
          player.club
        ].filter(Boolean).join(" "),
        username: player.username
      }));

    return [...registeredProfiles, ...standaloneProfiles];
  }, [players, professionalSettingsByUser, users]);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredProfiles = normalizedQuery
    ? profiles.filter((profile) =>
        profile.searchableText.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
      )
    : profiles;

  return (
    <ScrollView contentContainerStyle={styles.discoveryContent} keyboardShouldPersistTaps="handled">
      <View style={styles.discoveryHeader}>
        <Text style={styles.discoveryTitle}>Pesquisar perfis</Text>
        <Text style={styles.discoverySubtitle}>Encontre talentos, criadores, marcas, projetos e serviços.</Text>
      </View>

      <View style={styles.searchField}>
        <Search color={colors.muted} size={19} />
        <TextInput
          accessibilityLabel="Pesquisar perfis"
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Nome, @username, categoria, cidade ou área"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {query ? (
          <Pressable accessibilityLabel="Limpar pesquisa" hitSlop={8} onPress={() => setQuery("")} style={styles.searchClearButton}>
            <X color={colors.text} size={17} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsTitle}>{normalizedQuery ? "Resultados" : "Perfis disponíveis"}</Text>
        <Text style={styles.searchResultsCount}>{filteredProfiles.length}</Text>
      </View>

      {filteredProfiles.length === 0 ? (
        <View style={styles.discoveryEmptyState}>
          <Search color={colors.muted} size={28} />
          <Text style={styles.discoveryEmptyTitle}>Nenhum perfil encontrado</Text>
          <Text style={styles.discoveryEmptyBody}>Tente outro nome, categoria, cidade ou área de atuação.</Text>
        </View>
      ) : (
        filteredProfiles.map((profile) => {
          const initials = profile.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
          return (
            <Pressable
              accessibilityLabel={`Abrir perfil de ${profile.name}`}
              key={profile.id}
              onPress={() => {
                if (profile.player) {
                  onOpenPlayer(profile.player);
                  return;
                }
                if (profile.user) {
                  onOpenUser(profile.user);
                }
              }}
              style={({ pressed }) => [styles.searchProfileRow, pressed ? styles.buttonPressed : null]}
            >
              <View style={styles.searchProfileAvatar}>
                {profileAvatars[profile.profileId] ? (
                  <ProfileAvatarImage avatar={profileAvatars[profile.profileId]} />
                ) : (
                  <Text style={styles.searchProfileAvatarText}>{initials}</Text>
                )}
              </View>
              <View style={styles.searchProfileBody}>
                <Text numberOfLines={1} style={styles.searchProfileName}>{profile.name}</Text>
                {profile.username ? <Text numberOfLines={1} style={styles.searchProfileUsername}>@{profile.username}</Text> : null}
                <Text numberOfLines={1} style={styles.searchProfileMeta}>{profile.meta}</Text>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 5, marginTop: 3 }}>
                  {profile.professionalLabel ? <BadgeCheck color={colors.primary} size={13} /> : null}
                  <Text numberOfLines={1} style={[styles.searchProfileBadge, profile.professionalLabel ? styles.searchProfileBadgeActive : null]}>
                    {profile.professionalLabel ?? (profile.player ? "Perfil com publicações" : "Perfil cadastrado")}
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
