import { Capacitor, registerPlugin } from "@capacitor/core"

const notifications = registerPlugin<{
  enable(): Promise<{ enabled: boolean }>
  showIncoming(): Promise<{ enabled: boolean }>
  clear(): Promise<void>
  refreshRegistration(): Promise<void>
}>("MailNotifications")

export const hasNativeNotifications = () => Capacitor.getPlatform() === "android"
export const enableNativeNotifications = () => notifications.enable()
export const showNativeIncomingMail = () => notifications.showIncoming()
export const clearNativeNotifications = () => notifications.clear()
export const refreshNativePushRegistration = () => notifications.refreshRegistration()
