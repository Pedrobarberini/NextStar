import React from "react";
import { Eye, EyeOff, Share2, Trash2 } from "lucide-react-native";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { getContextMenuPosition } from "../utils/contextMenuPosition";

export type VideoActionsAnchor = {
  x: number;
  y: number;
};

export function VideoActionsPopover({
  anchor,
  canDelete,
  hidden,
  onClose,
  onDelete,
  onShare,
  onToggleHidden,
  visible
}: {
  anchor: VideoActionsAnchor | null;
  canDelete: boolean;
  hidden: boolean;
  onClose: () => void;
  onDelete: () => void;
  onShare: () => void;
  onToggleHidden: () => void;
  visible: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const position = getContextMenuPosition({
    anchorX: anchor?.x ?? width - 20,
    anchorY: anchor?.y ?? 20,
    menuHeight: canDelete ? 154 : 104,
    viewportHeight: height,
    viewportWidth: width
  });

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible && Boolean(anchor)}
    >
      <View style={styles.videoActionsPopoverRoot}>
        <Pressable
          accessibilityLabel="Fechar opções da publicação"
          onPress={onClose}
          style={styles.videoActionsPopoverBackdrop}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.videoActionsPopover,
            { left: position.left, top: position.top }
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={styles.videoActionsPopoverRow}
          >
            <Share2 color={colors.text} size={18} />
            <Text style={styles.videoActionsPopoverText}>Compartilhar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onToggleHidden}
            style={styles.videoActionsPopoverRow}
          >
            {hidden ? (
              <Eye color={colors.text} size={18} />
            ) : (
              <EyeOff color={colors.text} size={18} />
            )}
            <Text style={styles.videoActionsPopoverText}>
              {hidden ? "Mostrar no Início" : "Ocultar do Início"}
            </Text>
          </Pressable>
          {canDelete ? (
            <Pressable
              accessibilityRole="button"
              onPress={onDelete}
              style={[
                styles.videoActionsPopoverRow,
                styles.videoActionsPopoverRowLast
              ]}
            >
              <Trash2 color={colors.danger} size={18} />
              <Text style={styles.videoActionsPopoverDangerText}>Excluir</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
