import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Trash2, X } from "lucide-react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";

export function DeleteAccountModal({
  isDeleting,
  onClose,
  onConfirm,
  visible
}: {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
}) {
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
          accessibilityLabel="Cancelar exclusão da conta"
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
                <Text style={styles.deleteVideoTitle}>Excluir sua conta?</Text>
                <Text style={styles.confirmationDialogSubtitle}>
                  Esta ação é permanente.
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
            Seu perfil, publicações, foto, comentários e dados sociais serão
            removidos. Uma assinatura Plus ativa também será cancelada. Esta
            ação não pode ser desfeita.
          </Text>

          <View style={styles.confirmationDialogActions}>
            <Pressable
              disabled={isDeleting}
              onPress={onClose}
              style={styles.confirmationCancelButton}
            >
              <Text style={styles.confirmationCancelText}>Manter conta</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Confirmar exclusão da conta"
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
                {isDeleting ? "Excluindo..." : "Excluir conta"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
