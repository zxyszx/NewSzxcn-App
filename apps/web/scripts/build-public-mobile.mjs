import { cpSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

// Only reviewed app branding is bundled; reference wallpapers stay local.
const publicAssets = mkdtempSync(path.join(tmpdir(), "newmail-public-assets-"))
for (const entry of ["icons", "brand-icon.png", "site.webmanifest"]) {
  cpSync(path.resolve("public", entry), path.join(publicAssets, entry), { recursive: true })
}
const result = spawnSync("pnpm", ["exec", "vite", "build", "--mode", "demo", "--outDir", "dist-mobile"], {
  stdio: "inherit",
  env: { ...process.env, VITE_DEMO_MODE: "true", VITE_DEMO_BASE: "/",
    VITE_PUBLIC_DISTRIBUTION: "true", PUBLIC_ASSET_DIR: publicAssets },
})
process.exit(result.status ?? 1)
