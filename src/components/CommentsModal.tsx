import React, { useEffect, useState } from "react";
import { MessageCircle, Send, Trash2, X } from "lucide-react-native";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type { PostComment, ProfileAvatarsByProfile } from "../types";
import {
  formatPostCommentAge,
  MAX_POST_COMMENT_LENGTH
} from "../utils/postComments";
import { ProfileAvatarImage } from "./ProfileAvatarImage";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function CommentsModal({
  comments,
  currentUserId,
  onAddComment,
  onClose,
  onDeleteComment,
  onOpenAuthor,
  profileAvatars,
  videoId,
  videoTitle,
  visible
}: {
  comments: PostComment[];
  currentUserId: string;
  onAddComment: (body: string) => boolean;
  onClose: () => void;
  onDeleteComment: (commentId: string) => void;
  onOpenAuthor: (userId: string) => void;
  profileAvatars: ProfileAvatarsByProfile;
  videoId: string;
  videoTitle: string;
  visible: boolean;
}) {
  const [draft, setDraft] = useState("");
  const canSubmit = draft.trim().length > 0;

  useEffect(() => {
    if (!visible) {
      setDraft("");
    }
  }, [videoId, visible]);

  function submitComment() {
    if (canSubmit && onAddComment(draft)) {
      setDraft("");
    }
  }

  function confirmDelete(comment: PostComment) {
    Alert.alert(
      "Excluir comentário?",
      "Essa ação remove o comentário desta publicação.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          onPress: () => onDeleteComment(comment.id),
          style: "destructive",
          text: "Excluir"
        }
      ]
    );
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.commentsModalRoot}>
        <Pressable
          accessibilityLabel="Fechar comentários"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.commentsBackdrop}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.commentsKeyboardArea}
        >
          <View accessibilityViewIsModal style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <View style={styles.commentsHeaderIcon}>
                <MessageCircle color={colors.primary} size={19} />
              </View>
              <View style={styles.commentsHeaderText}>
                <Text style={styles.commentsTitle}>Comentários</Text>
                <Text numberOfLines={1} style={styles.commentsSubtitle}>
                  {comments.length} {comments.length === 1 ? "comentário" : "comentários"} · {videoTitle}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar"
                hitSlop={8}
                onPress={onClose}
                style={styles.commentsCloseButton}
              >
                <X color={colors.muted} size={20} />
              </Pressable>
            </View>

            {comments.length > 0 ? (
              <ScrollView
                contentContainerStyle={styles.commentsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.commentsScroll}
              >
                {comments.map((comment) => {
                  const avatar = profileAvatars[comment.authorProfileId];
                  const isOwner = comment.authorUserId === currentUserId;

                  return (
                    <View key={comment.id} style={styles.commentRow}>
                      <Pressable
                        accessibilityLabel={`Abrir perfil de ${comment.authorName}`}
                        accessibilityRole="button"
                        onPress={() => onOpenAuthor(comment.authorUserId)}
                        style={styles.commentAvatar}
                      >
                        {avatar ? (
                          <ProfileAvatarImage avatar={avatar} />
                        ) : (
                          <Text style={styles.commentAvatarText}>
                            {getInitials(comment.authorName)}
                          </Text>
                        )}
                      </Pressable>
                      <View style={styles.commentBody}>
                        <View style={styles.commentIdentityRow}>
                          <Pressable
                            accessibilityLabel={`Abrir perfil de ${comment.authorName}`}
                            accessibilityRole="button"
                            onPress={() => onOpenAuthor(comment.authorUserId)}
                            style={styles.commentIdentityButton}
                          >
                            <Text numberOfLines={1} style={styles.commentUsername}>
                              {comment.authorUsername
                                ? `@${comment.authorUsername}`
                                : comment.authorName}
                            </Text>
                            {comment.authorUsername ? (
                              <Text numberOfLines={1} style={styles.commentAuthorName}>
                                {comment.authorName}
                              </Text>
                            ) : null}
                          </Pressable>
                          <Text style={styles.commentTime}>
                            {formatPostCommentAge(comment.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.body}</Text>
                      </View>
                      {isOwner ? (
                        <Pressable
                          accessibilityLabel="Excluir comentário"
                          accessibilityRole="button"
                          hitSlop={7}
                          onPress={() => confirmDelete(comment)}
                          style={styles.commentDeleteButton}
                        >
                          <Trash2 color={colors.muted} size={17} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.commentsEmptyState}>
                <View style={styles.commentsEmptyIcon}>
                  <MessageCircle color={colors.primary} size={25} />
                </View>
                <Text style={styles.commentsEmptyTitle}>Inicie a conversa</Text>
                <Text style={styles.commentsEmptyBody}>
                  Seja a primeira pessoa a comentar nesta publicação.
                </Text>
              </View>
            )}

            <View style={styles.commentComposer}>
              <TextInput
                accessibilityLabel="Escrever comentário"
                maxLength={MAX_POST_COMMENT_LENGTH}
                multiline
                onChangeText={setDraft}
                placeholder="Adicione um comentário..."
                placeholderTextColor={colors.muted}
                style={styles.commentInput}
                value={draft}
              />
              <Pressable
                accessibilityLabel="Publicar comentário"
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={submitComment}
                style={[
                  styles.commentSendButton,
                  !canSubmit ? styles.commentSendButtonDisabled : null
                ]}
              >
                <Send color={colors.onPrimary} size={18} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}