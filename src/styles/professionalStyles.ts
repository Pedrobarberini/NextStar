import { StyleSheet } from "react-native";
import { colors } from "../theme";

export const professionalStyles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 7,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16
  },
  actionButtonDisabled: {
    opacity: 0.45
  },
  actionButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "900"
  },
  campaignItem: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingVertical: 14
  },
  campaignItemFirst: {
    borderTopWidth: 0,
    paddingTop: 4
  },
  campaignMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  campaignStatus: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  campaignStatusPaused: {
    color: colors.muted
  },
  campaignTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "900"
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  categoryOption: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 13,
    justifyContent: "center"
  },
  categoryOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  categoryOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  categoryOptionTextActive: {
    color: colors.primary
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 116
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5
  },
  emptyState: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 22
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44
  },
  headerSpacer: {
    width: 38
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center"
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    overflow: "hidden",
    padding: 18
  },
  heroDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroTitle: {
    color: colors.onPrimary,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4
  },
  inlineButton: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 11
  },
  inlineButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  input: {
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 13
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  metricGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  metricItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    flex: 1,
    minWidth: 0,
    padding: 11
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
    textTransform: "uppercase"
  },
  metricValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  notice: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    padding: 12
  },
  noticeText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  optionCard: {
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    padding: 13
  },
  optionCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  optionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  optionTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900"
  },
  planCard: {
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 10,
    padding: 14
  },
  planCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  planFeature: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  planPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  postItem: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 11,
    paddingVertical: 12
  },
  postItemFirst: {
    borderTopWidth: 0,
    paddingTop: 2
  },
  postMediaIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  postText: {
    flex: 1,
    minWidth: 0
  },
  postTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  postType: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3
  },
  preview: {
    alignItems: "center",
    backgroundColor: colors.media,
    borderRadius: 8,
    height: 210,
    justifyContent: "center",
    overflow: "hidden"
  },
  previewImage: {
    height: "100%",
    width: "100%"
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center"
  },
  reachValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "900"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8
  },
  smallSelector: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  smallSelectorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  smallSelectorText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  smallSelectorTextActive: {
    color: colors.onPrimary
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    marginTop: 14
  },
  switchText: {
    flex: 1,
    minWidth: 0
  }
});
