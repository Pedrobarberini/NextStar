import React, { useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  PlaySquare,
  Reply,
  X
} from "lucide-react-native";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type { AppNotification } from "../types";
import {
  formatNotificationTime,
  getNotificationText
} from "../utils/notifications";

function NotificationKindIcon({
  notification
}: {
  notification: AppNotification;
}) {
  switch (notification.kind) {
    case "like":
      return <Heart color={colors.like} fill={colors.like} size={18} />;
    case "comment":
      return <MessageCircle color={colors.primary} size={18} />;
    case "reply":
      return <Reply color={colors.primary} size={18} />;
    case "shared-post":
      return <PlaySquare color={colors.primary} size={18} />;
    case "message":
      return <MessageCircle color={colors.primary} size={18} />;
  }
}

export function NotificationsPopover({
  enabled,
  notifications,
  onClose,
  onSelect,
  visible
}: {
  enabled: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onSelect: (notification: AppNotification) => void;
  visible: boolean;
}) {
  const { width } = useWindowDimensions();
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      animation.setValue(0);
      return;
    }

    Animated.timing(animation, {
      duration: 220,
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [animation, visible]);

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.notificationsModalRoot}>
        <Pressable
          accessibilityLabel="Fechar notificações"
          onPress={onClose}
          style={styles.notificationsBackdrop}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.notificationsPanel,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0]
                  })
                }
              ],
              width: Math.min(360, width - 24)
            }
          ]}
        >
          <View style={styles.notificationsHeader}>
            <View style={styles.notificationsTitleRow}>
              <Bell color={colors.primary} size={20} />
              <Text style={styles.notificationsTitle}>Notificações</Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar notificações"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.notificationsCloseButton}
            >
              <X color={colors.muted} size={20} />
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.notificationsEmpty}>
              {enabled ? (
                <Bell color={colors.muted} size={26} />
              ) : (
                <BellOff color={colors.muted} size={26} />
              )}
              <Text style={styles.notificationsEmptyTitle}>
                {enabled ? "Tudo tranquilo por aqui" : "Notificações desativadas"}
              </Text>
              <Text style={styles.notificationsEmptyBody}>
                {enabled
                  ? "Curtidas, comentários e mensagens aparecerão neste espaço."
                  : "Ative as notificações em Configurações para receber novos avisos."}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.notificationsList}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((notification) => (
                <Pressable
                  accessibilityLabel={getNotificationText(notification)}
                  accessibilityRole="button"
                  key={notification.id}
                  onPress={() => onSelect(notification)}
                  style={[
                    styles.notificationRow,
                    !notification.readAt
                      ? styles.notificationRowUnread
                      : null
                  ]}
                >
                  <View style={styles.notificationIcon}>
                    <NotificationKindIcon notification={notification} />
                  </View>
                  <View style={styles.notificationTextBlock}>
                    <Text style={styles.notificationText}>
                      {getNotificationText(notification)}
                    </Text>
                    {notification.preview ? (
                      <Text numberOfLines={1} style={styles.notificationPreview}>
                        {notification.preview}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.notificationTime}>
                    {formatNotificationTime(notification.createdAt)}
                  </Text>
                  {!notification.readAt ? (
                    <View style={styles.notificationUnreadDot} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}