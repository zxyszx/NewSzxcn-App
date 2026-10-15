import { Capacitor, registerPlugin } from "@capacitor/core"

const notifications = registerPlugin<{
  enable(): Promise<{ enabled: boolean }>
  showIncoming(options: { subject: string }): Promise<{ enabled: boolean }>
  clear(): Promise<void>
  refreshRegistration(): Promise<void>
  setReadingZoom(options: { enabled: boolean }): Promise<void>
}>("MailNotifications")

export const hasNativeNotifications = () => Capacitor.getPlatform() === "android"
export const enableNativeNotifications = () => notifications.enable()
export const showNativeIncomingMail = (subject: string) => notifications.showIncoming({ subject })
export const clearNativeNotifications = () => notifications.clear()
export const refreshNativePushRegistration = () => notifications.refreshRegistration()
export const setNativeReadingZoom = (enabled: boolean) => notifications.setReadingZoom({ enabled })
