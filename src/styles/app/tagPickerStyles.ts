import { colors } from "../../theme";

export const tagPickerStyles = {
  tagPicker: {
    gap: 10,
    marginTop: 4
  },
  tagPickerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  tagPickerCopy: {
    flex: 1
  },
  tagPickerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  tagPickerHint: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3
  },
  tagPickerCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  tagPickerSelectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  tagPickerSelectedChip: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    minHeight: 32,
    paddingHorizontal: 10
  },
  tagPickerSelectedText: {
    color: colors.onPrimary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  tagPickerInputRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12
  },
  tagPickerInput: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    minWidth: 0,
    paddingVertical: 10
  },
  tagPickerSuggestionList: {
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    overflow: "hidden"
  },
  tagPickerSuggestionRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tagPickerSuggestionCopy: {
    flex: 1,
    minWidth: 0
  },
  tagPickerSuggestionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  tagPickerSuggestionMeta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2
  },
  tagPickerCreateIcon: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28
  },
  tagPickerCheck: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  tagPickerCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tagPickerCheckText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "900"
  }
} as const;