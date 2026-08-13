import { StyleSheet } from "react-native";
import { colors } from "../../theme";

export const notificationStyles = {
  feedNotificationControl: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 8
  },
  feedNotificationButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    position: "relative",
    width: 34
  },
  feedNotificationBadge: {
    alignItems: "center",
    backgroundColor: colors.like,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 16,
    minWidth: 16,
    paddingHorizontal: 3,
    position: "absolute",
    right: -2,
    top: -2
  },
  feedNotificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 12
  },
  notificationsModalRoot: {
    flex: 1
  },
  notificationsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent"
  },
  notificationsPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 12,
    maxHeight: "72%",
    overflow: "hidden",
    position: "absolute",
    right: 12,
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    top: 54
  },
  notificationsHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 14
  },
  notificationsTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9
  },
  notificationsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  notificationsCloseButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  notificationsList: {
    paddingVertical: 4
  },
  notificationRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "relative"
  },
  notificationRowUnread: {
    backgroundColor: colors.primarySoft
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36
  },
  notificationTextBlock: {
    flex: 1,
    paddingRight: 8
  },
  notificationText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  notificationPreview: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
  },
  notificationTime: {
    alignSelf: "flex-start",
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3
  },
  notificationUnreadDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 6,
    position: "absolute",
    right: 7,
    top: 33,
    width: 6
  },
  notificationsEmpty: {
    alignItems: "center",
    minHeight: 190,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 30
  },
  notificationsEmptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 12
  },
  notificationsEmptyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    textAlign: "center"
  }
} as const;