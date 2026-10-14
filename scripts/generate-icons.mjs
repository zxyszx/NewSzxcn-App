import { createRequire } from "node:module"
import { readFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const sharp = require(process.env.SHARP_MODULE || "sharp")
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const svg = readFileSync(path.join(root, "branding/app-icon.svg"), "utf8")
const publicDir = path.join(root, "apps/web/public")
const res = path.join(root, "apps/web/android/app/src/main/res")
const icon = Buffer.from(svg)
const foreground = Buffer.from(svg.replace(/<rect width="1024" height="1024" fill="url\(#bg\)"\/>/, "")
  .replace('<g id="mark">', '<g id="mark" transform="translate(184 184) scale(.64)">'))
for (const [name, size] of Object.entries({ "icon-1024": 1024, "icon-512": 512, "icon-maskable-512": 512, "icon-192": 192, "apple-touch-icon": 180, "favicon-32": 32 })) {
  await sharp(icon).resize(size, size).png().toFile(path.join(publicDir, "icons", `${name}.png`))
}
await sharp(icon).resize(512).png().toFile(path.join(publicDir, "brand-icon.png"))
await sharp(icon).png().toFile(path.join(root, "branding/app-icon-1024.png"))
for (const [density, size, fgSize] of [["mdpi",48,108],["hdpi",72,162],["xhdpi",96,216],["xxhdpi",144,324],["xxxhdpi",192,432]]) {
  const dir = path.join(res, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(icon).resize(size).png().toFile(path.join(dir,"ic_launcher.png"))
  await sharp(icon).resize(size).png().toFile(path.join(dir,"ic_launcher_round.png"))
  await sharp(foreground).resize(fgSize).png().toFile(path.join(dir,"ic_launcher_foreground.png"))
}
console.log("Generated NewSzxcn brand and Android launcher assets")
