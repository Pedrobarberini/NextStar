import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type { AppUser } from "../types";
import {
  selectMentionCandidates,
  toggleSubmissionMention
} from "../utils/submissionMetadata";
import { LabeledInput } from "./Navigation";
import { MentionSuggestionsPopover } from "./MentionSuggestionsPopover";

const MAX_MENTIONS = 8;

export function SubmissionMentionPicker({
  accounts,
  currentUserId,
  onChange,
  value
}: {
  accounts: AppUser[];
  currentUserId: string;
  onChange: (usernames: string[]) => void;
  value: string[];
}) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidates = useMemo(
    () => selectMentionCandidates(accounts, currentUserId, query, 5, true),
    [accounts, currentUserId, query]
  );

  useEffect(
    () => () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    },
    []
  );

  function toggleMention(username: string) {
    onChange(toggleSubmissionMention(value, username, MAX_MENTIONS));
    setQuery("");
    setFocused(false);
  }

  return (
    <View style={styles.submissionMentionPicker}>
      <LabeledInput
        autoCapitalize="none"
        autoCorrect={false}
        label="Marcar pessoas"
        onBlur={() => {
          blurTimerRef.current = setTimeout(() => setFocused(false), 140);
        }}
        onChangeText={setQuery}
        onFocus={() => {
          if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
          setFocused(true);
        }}
        placeholder="Busque por nome ou @usuário"
        value={query}
      />
      <MentionSuggestionsPopover
        candidates={candidates}
        onSelect={(account) => toggleMention(account.username)}
        selectedUsernames={value}
        visible={focused}
      />
      <Text style={styles.submissionMentionHint}>
        Selecione até {MAX_MENTIONS} perfis cadastrados.
      </Text>

      {value.length > 0 ? (
        <View style={styles.submissionMentionSelectedRow}>
          {value.map((username) => (
            <Pressable
              accessibilityLabel={"Remover marcação de @" + username}
              accessibilityRole="button"
              key={username}
              onPress={() => toggleMention(username)}
              style={styles.submissionMentionChip}
            >
              <Text numberOfLines={1} style={styles.submissionMentionChipText}>
                {"@" + username}
              </Text>
              <X color={colors.primary} size={14} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}