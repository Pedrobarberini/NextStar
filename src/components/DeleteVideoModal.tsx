import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Trash2, X } from "lucide-react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";

export function DeleteVideoModal({
  isDeleting,
  itemCount = 1,
  onClose,
  onConfirm,
  videoTitle,
  visible
}: {
  isDeleting: boolean;
  itemCount?: number;
  onClose: () => void;
  onConfirm: () => void;
  videoTitle: string;
  visible: boolean;
}) {
  const isBatch = itemCount > 1;

  return (
    <Modal
      animationType="fade"
      onRequestClose={isDeleting ? undefined : onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.confirmationModalRoot}>
        <Pressable
          accessibilityLabel="Cancelar exclusão"
          disabled={isDeleting}
          onPress={onClose}
          style={styles.confirmationModalBackdrop}
        />
        <View accessibilityViewIsModal style={styles.deleteVideoDialog}>
          <View style={styles.confirmationDialogHeader}>
            <View style={styles.deleteVideoTitleRow}>
              <View style={styles.deleteVideoIcon}>
                <Trash2 color={colors.danger} size={20} />
              </View>
              <View style={styles.confirmationDialogTitleBlock}>
                <Text style={styles.deleteVideoTitle}>
                  {isBatch
                    ? `Apagar ${itemCount} publicações?`
                    : "Excluir publicação?"}
                </Text>
                <Text numberOfLines={2} style={styles.confirmationDialogSubtitle}>
                  {videoTitle}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Fechar"
              disabled={isDeleting}
              hitSlop={8}
              onPress={onClose}
              style={styles.confirmationCloseButton}
            >
              <X color={colors.muted} size={20} />
            </Pressable>
          </View>

          <Text style={styles.deleteVideoBody}>
            {isBatch
              ? "As publicações serão removidas do Início e do seu perfil. Esta ação não pode ser desfeita."
              : "A publicação será removida do Início e do seu perfil. Esta ação não pode ser desfeita."}
          </Text>

          <View style={styles.confirmationDialogActions}>
            <Pressable
              disabled={isDeleting}
              onPress={onClose}
              style={styles.confirmationCancelButton}
            >
              <Text style={styles.confirmationCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Confirmar exclusão"
              disabled={isDeleting}
              onPress={onConfirm}
              style={[
                styles.deleteVideoConfirmButton,
                isDeleting ? styles.primaryButtonDisabled : null
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Trash2 color={colors.onPrimary} size={17} />
              )}
              <Text style={styles.deleteVideoConfirmText}>
                {isDeleting
                  ? "Excluindo..."
                  : isBatch
                    ? "Apagar publicações"
                    : "Excluir publicação"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
