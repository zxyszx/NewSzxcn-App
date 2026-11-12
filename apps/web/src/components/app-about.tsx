import * as React from "react"
import { Capacitor, registerPlugin } from "@capacitor/core"
import { Info, RefreshCcw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigateToMailLink } from "@/lib/mail-links"

const releasePage = "https://github.com/zxyszx/NewSzxcn-App/releases/latest"
const app = registerPlugin<{ appInfo(): Promise<{ version: string }> }>("MailNotifications")

export function AppAbout() {
  const [version, setVersion] = React.useState<string>()
  const [checking, setChecking] = React.useState(false)
  const [status, setStatus] = React.useState("")
  React.useEffect(() => {
    if (Capacitor.getPlatform() === "android") void app.appInfo().then((info) => setVersion(info.version)).catch(() => setStatus("无法读取应用版本，请在发布页查看。"))
  }, [])
  async function checkUpdate() {
    setChecking(true)
    setStatus("正在检查更新…")
    try {
      const response = await fetch("https://api.github.com/repos/zxyszx/NewSzxcn-App/releases/latest", { signal: AbortSignal.timeout(12000), credentials: "omit" })
      if (!response.ok) throw new Error()
      const release: unknown = await response.json()
      const tag = typeof release === "object" && release !== null && "tag_name" in release ? String(release.tag_name) : ""
      const latest = /^android-v(\d+\.\d+\.\d+)$/.exec(tag)?.[1]
      if (!latest) throw new Error()
      const newer = !version || latest.split(".").reduce((result, part, index) => result || Math.sign(Number(part) - Number(version.split(".")[index] || 0)), 0) > 0
      setStatus(newer ? `可用版本 ${latest}，请前往发布页下载。` : `当前版本 ${version} 已是最新。`)
    } catch {
      setStatus("暂时无法检查更新，请稍后重试，或打开发布页查看。")
    } finally { setChecking(false) }
  }
  return <div className="app-about space-y-4">
    <div className="rounded-2xl bg-card p-5 text-center"><Info className="mx-auto mb-3 size-10 text-primary" /><h2 className="text-lg font-semibold">NewSzxcn</h2><p className="mt-1 text-sm text-muted-foreground">{version ? `版本 ${version}` : "NewSzxcn 邮箱"}</p></div>
    <section className="mobile-settings-group">
      <Button className="h-14 w-full justify-start px-4" variant="ghost" disabled={checking} onClick={() => void checkUpdate()}><RefreshCcw className={checking ? "animate-spin" : ""} />检查更新</Button>
      <Button className="h-14 w-full justify-start px-4" variant="ghost" onClick={() => navigateToMailLink(releasePage)}><ExternalLink />GitHub 发布页</Button>
    </section>
    <p role="status" aria-live="polite" className="px-3 text-sm text-muted-foreground">{status}</p>
  </div>
}
