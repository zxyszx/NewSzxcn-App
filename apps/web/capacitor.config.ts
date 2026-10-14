import type { CapacitorConfig } from "@capacitor/cli"

const liveMail = process.env.NEWSZXCN_LIVE_MAIL === "true"

const config: CapacitorConfig = {
  appId: "com.newszxcn.newmail",
  appName: "NewSzxcn",
  webDir: "dist-mobile",
  server: { cleartext: false, hostname: liveMail ? "mail.newszxcn.com" : "localhost", androidScheme: "https" },
  loggingBehavior: liveMail ? "none" : "debug",
  android: { webContentsDebuggingEnabled: !liveMail || process.env.NEWSZXCN_WEBVIEW_DEBUG === "true" },
  plugins: { LiveMail: { enabled: liveMail } },
}

export default config
