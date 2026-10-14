import type { CapacitorConfig } from "@capacitor/cli"

// This first native build is an offline, read-only demo, not a production mail client.
const config: CapacitorConfig = {
  appId: "com.newszxcn.newmail",
  appName: "NewSzxcn",
  webDir: "dist-mobile",
  server: { cleartext: false },
}

export default config
