import React from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";
import { styles } from "../styles/appStyles";
import type { ProfileAvatar } from "../types";
import { ProfileAvatarImage } from "./ProfileAvatarImage";

export function ProfileAvatarPreviewModal({
  avatar,
  onClose,
  visible
}: {
  avatar?: ProfileAvatar;
  onClose: () => void;
  visible: boolean;
}) {
  const { width } = useWindowDimensions();
  const previewSize = Math.min(Math.max(width * 0.68, 180), 280);

  if (!avatar) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.profileAvatarPreviewModalRoot}>
        <Pressable
          accessibilityLabel="Fechar foto do perfil"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.profileAvatarPreviewBackdrop}
        />
        <View
          accessibilityLabel="Foto do perfil ampliada"
          accessibilityRole="image"
          style={[
            styles.profileAvatarPreviewCircle,
            { height: previewSize, width: previewSize }
          ]}
        >
          <ProfileAvatarImage avatar={avatar} />
        </View>
      </View>
    </Modal>
  );
}