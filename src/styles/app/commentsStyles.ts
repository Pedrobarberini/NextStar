import { StyleSheet } from "react-native";
import { colors } from "../../theme";

export const commentsStyles = {
  commentsModalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end"
  },
  commentsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 18, 12, 0.58)"
  },
  commentsKeyboardArea: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%"
  },
  commentsSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    maxHeight: "78%",
    maxWidth: 560,
    minHeight: 410,
    overflow: "hidden",
    width: "100%"
  },
  commentsHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 66,
    paddingHorizontal: 16
  },
  commentsHeaderIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  commentsHeaderText: {
    flex: 1,
    minWidth: 0
  },
  commentsTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  commentsSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2
  },
  commentsCloseButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38
  },
  commentsScroll: {
    flexShrink: 1
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  commentRow: {
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 13
  },
  commentAvatar: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    overflow: "hidden",
    width: 38
  },
  commentAvatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900"
  },
  commentBody: {
    flex: 1,
    minWidth: 0
  },
  commentIdentityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  commentIdentityButton: {
    flex: 1,
    minWidth: 0
  },
  commentUsername: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  commentAuthorName: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1
  },
  commentTime: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  commentText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6
  },
  commentDeleteButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 30
  },
  commentsEmptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 240,
    padding: 24
  },
  commentsEmptyIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  commentsEmptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14
  },
  commentsEmptyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    textAlign: "center"
  },
  commentComposer: {
    alignItems: "flex-end",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 12
  },
  commentInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    maxHeight: 96,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top"
  },
  commentSendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  commentSendButtonDisabled: {
    opacity: 0.38
  }
} as const;