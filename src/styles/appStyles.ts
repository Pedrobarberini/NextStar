import { StyleSheet } from "react-native";
import { createThemedStyles } from "../theme";
import { baseStyles } from "./app/baseStyles";
import { authStyles } from "./app/authStyles";
import { navigationStyles } from "./app/navigationStyles";
import { feedStyles } from "./app/feedStyles";
import { sharedContentStyles } from "./app/sharedContentStyles";
import { mediaDetailStyles } from "./app/mediaDetailStyles";
import { submissionAdminStyles } from "./app/submissionAdminStyles";
import { profileStyles } from "./app/profileStyles";
import { accountAvatarSettingsStyles } from "./app/accountAvatarSettingsStyles";
import { discoveryMessagesStyles } from "./app/discoveryMessagesStyles";
import { profileDiscoveryStyles } from "./app/profileDiscoveryStyles";
import { commentsStyles } from "./app/commentsStyles";
import { securityStyles } from "./app/securityStyles";
import { notificationStyles } from "./app/notificationStyles";
import { tagPickerStyles } from "./app/tagPickerStyles";

export const styles = createThemedStyles(StyleSheet.create({
  ...baseStyles,
  ...authStyles,
  ...navigationStyles,
  ...feedStyles,
  ...sharedContentStyles,
  ...mediaDetailStyles,
  ...submissionAdminStyles,
  ...profileStyles,
  ...accountAvatarSettingsStyles,
  ...discoveryMessagesStyles,
  ...profileDiscoveryStyles,
  ...commentsStyles,
  ...securityStyles,
  ...notificationStyles,
  ...tagPickerStyles
}));
