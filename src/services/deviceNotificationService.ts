import { Platform } from "react-native";
import type { AppNotification } from "../types";
import { getNotificationText } from "../utils/notifications";

export type DeviceNotificationPermission =
  | "default"
  | "denied"
  | "granted"
  | "unsupported";

function getNotificationApi() {
  if (
    Platform.OS !== "web" ||
    typeof globalThis === "undefined" ||
    !("Notification" in globalThis)
  ) {
    return null;
  }

  return globalThis.Notification;
}

export function getDeviceNotificationPermission(): DeviceNotificationPermission {
  return getNotificationApi()?.permission ?? "unsupported";
}

export async function requestDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  const notificationApi = getNotificationApi();

  if (!notificationApi) {
    return "unsupported";
  }
  if (notificationApi.permission !== "default") {
    return notificationApi.permission;
  }

  return notificationApi.requestPermission();
}

export function showDeviceNotification(notification: AppNotification) {
  const notificationApi = getNotificationApi();

  if (!notificationApi || notificationApi.permission !== "granted") {
    return false;
  }

  const popup = new notificationApi("Xolot", {
    body: getNotificationText(notification),
    icon: "/favicon.ico",
    tag: "xolot-" + notification.id
  });

  popup.onclick = () => {
    if (typeof window !== "undefined") {
      window.focus();
    }
    popup.close();
  };

  return true;
}