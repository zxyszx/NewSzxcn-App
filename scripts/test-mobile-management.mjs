import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"

// Run against a debug APK containing demo assets, never a signed-in production WebView.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.connectOverCDP(process.env.CDP_URL || "http://127.0.0.1:9238")
const page = browser.contexts()[0].pages().find((item) => item.url().startsWith("https://localhost/"))
assert(page, "Demo APK WebView not found")
const output = resolve("artifacts/mobile-management-qa")
await mkdir(output, { recursive: true })
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
const adb = process.env.ADB || "adb"
const serial = process.env.ANDROID_SERIAL || "emulator-5558"
assert(serial.startsWith("emulator-"), "This test changes display size; use an isolated emulator only")
const go = async (route) => {
  await page.evaluate((route) => { location.hash = route }, route)
  await page.locator(".mobile-management-header").waitFor()
  await page.waitForTimeout(250)
}
const back = async (expected) => {
  execFileSync(adb, ["-s", serial, "shell", "input", "keyevent", "4"])
  await page.waitForFunction((expected) => location.hash === `#${expected}`, expected)
}
const layout = async (name) => {
  assert.equal(await page.locator(".mobile-management-header").count(), 1, `${name}: duplicate header`)
  const sizes = await page.evaluate(() => {
    const body = document.querySelector(".mobile-management-body")
    const header = document.querySelector(".mobile-management-header")
    return { width: body.clientWidth, scrollWidth: body.scrollWidth, headerHeight: header.getBoundingClientRect().height }
  })
  assert(sizes.scrollWidth <= sizes.width + 1, `${name}: horizontal overflow ${JSON.stringify(sizes)}`)
  assert(sizes.headerHeight >= 44 && sizes.headerHeight <= 80, `${name}: oversized header`)
}
try {
  await go("/profile")
  assert(await page.getByRole("heading", { name: "设置", exact: true }).isVisible())
  assert((await page.locator("body").innerText()).includes("admin@demo.newszxcn.com"), "Use only the isolated demo administrator")
  assert.equal(await page.getByRole("searchbox", { name: "搜索设置项" }).evaluate((element) => getComputedStyle(element).borderTopWidth), "0px", "Settings search must not have a nested form border")
  await page.screenshot({ path: `${output}/settings-index.png` })
  await page.getByRole("searchbox", { name: "搜索设置项" }).fill("安全")
  assert.equal(await page.locator(".mobile-management-row").count(), 1)
  await page.getByRole("searchbox", { name: "搜索设置项" }).fill("不存在的设置")
  assert(await page.getByRole("status").filter({ hasText: "没有匹配的设置项" }).isVisible())
  await page.getByRole("button", { name: "清空搜索", exact: true }).click()
  assert.equal(await page.getByRole("searchbox", { name: "搜索设置项" }).inputValue(), "")
  assert(await page.getByRole("searchbox", { name: "搜索设置项" }).evaluate((element) => document.activeElement === element), "Clearing search must retain input focus")
  await page.getByRole("heading", { name: "设置", exact: true }).click()
  await page.getByRole("button", { name: "安全", exact: true }).click()
  await page.getByRole("heading", { name: "安全", exact: true }).waitFor()
  assert.equal(await page.locator(".mobile-management").getAttribute("data-direction"), "forward")
  const slide = await page.locator(".mobile-management").evaluate((element) => {
    const animation = element.getAnimations()[0]
    if (!animation) return null
    animation.pause()
    animation.currentTime = 80
    return { name: getComputedStyle(element).animationName, duration: animation.effect.getTiming().duration, x: element.getBoundingClientRect().x, width: innerWidth }
  })
  assert(slide && slide.name === "mobile-settings-enter" && slide.duration === 240 && slide.x > 0 && slide.x < slide.width, "Detail must slide in from the right")
  await page.screenshot({ path: `${output}/detail-slide-in.png` })
  await page.locator(".mobile-management").evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()))
  await back("/profile")
  assert.equal(await page.locator(".mobile-management").getAttribute("data-direction"), "back")
  for (const key of ["account", "mail", "clients", "security", "appearance"]) {
    await go(`/profile?tab=profile&accountTab=${key}`)
    await layout(`profile:${key}`)
    await page.screenshot({ path: `${output}/detail-profile-${key}.png` })
    if (key === "account") await page.screenshot({ path: `${output}/settings-account.png` })
    if (key === "account") assert.equal(await page.getByRole("group", { name: "邮件列表显示模式" }).count(), 0)
    if (key === "appearance") {
      const density = page.getByRole("group", { name: "邮件列表显示模式" })
      await density.getByRole("button", { name: "紧凑布局" }).click()
      assert.equal(await page.evaluate(() => localStorage.getItem("lanqin:display-mode")), "compact")
      assert.equal(await density.getByRole("button", { name: "紧凑布局" }).getAttribute("aria-pressed"), "true")
      await page.getByRole("button", { name: "返回邮箱", exact: true }).click()
      const row = page.locator(".mail-compact-message-row").first()
      await row.waitFor()
      const compactHeight = await row.evaluate((element) => element.getBoundingClientRect().height)
      await go("/profile?tab=profile&accountTab=appearance")
      await density.getByRole("button", { name: "标准布局" }).click()
      assert.equal(await page.evaluate(() => localStorage.getItem("lanqin:display-mode")), "detailed")
      assert.equal(await density.getByRole("button", { name: "标准布局" }).evaluate((element) => getComputedStyle(element).backgroundImage), "none", "Density segments must not inherit the old blue gradient")
      await page.getByRole("button", { name: "返回邮箱", exact: true }).click()
      await row.waitFor()
      const standardHeight = await row.evaluate((element) => element.getBoundingClientRect().height)
      assert(standardHeight > compactHeight && compactHeight >= 44, "Mobile list density must change without shrinking rows below touch-target height")
      await go("/profile?tab=profile&accountTab=appearance")
      await page.screenshot({ path: `${output}/settings-appearance.png` })
    }
    await back("/profile")
  }
  for (const key of ["mailboxes", "contacts", "cleanup", "cleanupQueue", "rules", "blocked", "stats", "apiTokens"]) {
    await go(`/profile?tab=${key}`)
    await layout(`profile:${key}`)
    assert(await page.locator(".mobile-management-header h1").evaluate((element) => document.activeElement === element), "Route heading must receive accessible focus")
    await page.screenshot({ path: `${output}/detail-profile-${key}.png` })
    await back("/profile")
  }
  await go("/profile?tab=profile&accountTab=appearance")
  const savedScroll = await page.locator(".mobile-management-body").evaluate((element) => { element.scrollTop = 160; return element.scrollTop })
  await page.waitForTimeout(100)
  await back("/profile")
  await page.getByRole("button", { name: "外观", exact: true }).click()
  assert.equal(await page.locator(".mobile-management-body").evaluate((element) => element.scrollTop), savedScroll, "Returning to a settings page must restore scroll")
  await back("/profile")
  await page.getByRole("button", { name: "后台管理", exact: true }).click()
  await page.getByRole("heading", { name: "后台管理", exact: true }).waitFor()
  await page.screenshot({ path: `${output}/admin-index.png` })
  for (const key of ["overview", "users", "permissionGroups", "domains", "mailboxes", "aliases", "messages", "sendAudit", "backups", "settings"]) {
    await go(`/admin?section=${key}`)
    await layout(`admin:${key}`)
    await page.screenshot({ path: `${output}/detail-admin-${key}.png` })
    await back("/admin")
  }
  for (const key of ["base", "smtp", "storage", "mail", "externalImap", "templates", "security"]) {
    await go(`/admin?section=settings&settingsTab=${key}`)
    await layout(`system:${key}`)
    await page.screenshot({ path: `${output}/detail-system-${key}.png` })
    if (key === "base") await page.screenshot({ path: `${output}/admin-system-base.png` })
    await back("/admin?section=settings")
    await back("/admin")
  }
  await back("/mail")
  for (const [route, trigger, title] of [
    ["/profile?tab=contacts", "新增", "新增联系人"],
    ["/profile?tab=profile&accountTab=security", "修改密码", "修改密码"],
    ["/profile?tab=profile&accountTab=mail", "新建签名", "新建签名"],
    ["/profile?tab=rules", "新建规则", "新建规则"],
    ["/admin?section=users", "添加账号", "创建用户账号"],
    ["/admin?section=domains", "添加域名", "添加域名"],
    ["/admin?section=mailboxes", "添加邮箱", "创建邮箱"],
    ["/admin?section=aliases", "添加转发", "创建邮件转发"],
  ]) {
    await go(route)
    await page.getByRole("button", { name: trigger, exact: true }).click()
    const editor = page.getByRole("dialog")
    await editor.getByRole("heading", { name: title, exact: true }).waitFor()
    await page.waitForTimeout(300)
    const dimensions = await editor.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const body = element.querySelector(".management-editor-body")
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, vw: innerWidth, vh: innerHeight, scrollWidth: body.scrollWidth, bodyWidth: body.clientWidth }
    })
    assert(Math.abs(dimensions.x) < 1 && Math.abs(dimensions.y) < 1 && Math.abs(dimensions.width - dimensions.vw) < 1 && Math.abs(dimensions.height - dimensions.vh) < 1, `${title}: editor must fill the phone screen ${JSON.stringify(dimensions)}`)
    assert(dimensions.scrollWidth <= dimensions.bodyWidth + 1, `${title}: editor horizontal overflow`)
    await page.screenshot({ path: `${output}/editor-${title}.png` })
    await editor.getByRole("button", { name: "返回上一级", exact: true }).click()
    await editor.waitFor({ state: "hidden" })
    assert(page.url().endsWith(`#${route}`), `${title}: closing must preserve its parent page`)
  }
  await go("/profile?tab=rules")
  await page.getByRole("button", { name: "新建规则", exact: true }).click()
  await page.getByRole("dialog").waitFor()
  execFileSync(adb, ["-s", serial, "shell", "input", "keyevent", "4"])
  // Android dismisses the software keyboard before delivering a back press to the dialog.
  try { await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 2000 }) } catch {
    execFileSync(adb, ["-s", serial, "shell", "input", "keyevent", "4"])
  }
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  assert(page.url().endsWith("#/profile?tab=rules"), "Dialog back must not leave its parent page")
  execFileSync(adb, ["-s", serial, "shell", "wm", "size", "840x1680"])
  await page.waitForFunction(() => innerWidth <= 320)
  await go("/profile?tab=profile&accountTab=appearance")
  await page.getByRole("group", { name: "显示模式", exact: true }).getByRole("button", { name: "深色", exact: true }).click()
  await page.evaluate(() => { document.documentElement.style.fontSize = "20px" })
  for (const route of ["/profile", "/profile?tab=profile&accountTab=account", "/profile?tab=profile&accountTab=security", "/admin", "/admin?section=users", "/admin?section=settings&settingsTab=base"]) {
    await go(route)
    await layout(`narrow-large-dark:${route}`)
    assert(await page.locator("html").evaluate((element) => element.classList.contains("dark")), `${route}: dark theme must survive navigation`)
  }
  await page.screenshot({ path: `${output}/narrow-dark-large-text.png` })
  for (const [route, trigger] of [["/profile?tab=contacts", "新增"], ["/profile?tab=profile&accountTab=mail", "新建签名"], ["/admin?section=users", "添加账号"]]) {
    await go(route)
    await page.getByRole("button", { name: trigger, exact: true }).click()
    const editor = page.getByRole("dialog")
    await editor.waitFor()
    await page.waitForTimeout(300)
    assert(await page.locator("html").evaluate((element) => element.classList.contains("dark")), `${trigger}: editor must use the selected dark theme`)
    const size = await editor.locator(".management-editor-body").evaluate((element) => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }))
    assert(size.scrollWidth <= size.width + 1, `${trigger}: narrow/large-text editor overflow`)
    await page.screenshot({ path: `${output}/editor-narrow-${trigger}.png` })
    await editor.getByRole("button", { name: "返回上一级", exact: true }).click()
    await editor.waitFor({ state: "hidden" })
  }
  await go("/profile?tab=profile&accountTab=appearance")
  await page.getByRole("group", { name: "显示模式", exact: true }).getByRole("button", { name: "浅色", exact: true }).click()
  await page.evaluate(() => { document.documentElement.style.fontSize = "" })
  execFileSync(adb, ["-s", serial, "shell", "wm", "size", "reset"])
  await page.emulateMedia({ reducedMotion: "reduce" })
  await go("/profile?tab=contacts")
  await page.getByRole("button", { name: "新增", exact: true }).click()
  assert.equal(await page.getByRole("dialog").evaluate((element) => getComputedStyle(element).animationName), "none", "Editor must respect reduced motion")
  await page.getByRole("dialog").getByRole("button", { name: "返回上一级", exact: true }).click()
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  await page.emulateMedia({ reducedMotion: "no-preference" })
  execFileSync(adb, ["-s", serial, "shell", "wm", "size", "2560x1600"])
  await page.waitForFunction(() => innerWidth > 767)
  await page.evaluate(() => { location.hash = "/admin?section=users" })
  // A resized emulator surface does not expand CDP's pointer viewport.
  await page.getByRole("button", { name: "添加账号", exact: true }).evaluate((element) => element.click())
  const desktopDialog = page.getByRole("dialog")
  await desktopDialog.waitFor()
  assert.equal(await desktopDialog.locator(".management-editor-header").count(), 0, "Desktop must keep its existing dialog layout")
  assert(await desktopDialog.evaluate((element) => element.getBoundingClientRect().width < innerWidth), "Desktop dialog must not become a phone full-screen editor")
  await desktopDialog.getByRole("button", { name: "关闭", exact: true }).evaluate((element) => element.click())
  await desktopDialog.waitFor({ state: "hidden" })
  execFileSync(adb, ["-s", serial, "shell", "wm", "size", "reset"])
  await page.waitForFunction(() => innerWidth < 768)
  await go("/profile?tab=profile&accountTab=security")
  await page.getByRole("button", { name: "返回邮箱", exact: true }).click()
  await page.waitForFunction(() => location.hash === "#/mail")
  await go("/profile")
  await page.getByRole("button", { name: "返回上一级", exact: true }).click()
  await page.waitForFunction(() => location.hash === "#/mail")
  assert.deepEqual(errors, [], "WebView runtime errors")
  console.log("PASS: 30 detail routes, 8 full-screen editor flows, 3 narrow/dark/large-text editors, reduced motion, desktop dialog fallback, Android back hierarchy, dialog dismissal, mailbox exits and overflow checks")
  console.log(`Screenshots: ${output}`)
} finally {
  execFileSync(adb, ["-s", serial, "shell", "wm", "size", "reset"])
  await browser.close()
}
