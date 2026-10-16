import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"

// The demo API rejects writes: this verifies failure recovery without touching real mail.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright")
const browser = await chromium.connectOverCDP(process.env.CDP_URL || "http://127.0.0.1:9238")
const page = browser.contexts()[0].pages().find((item) => item.url().startsWith("https://localhost/"))
assert(page, "Isolated demo WebView required")
const output = "artifacts/external-mailbox-qa"
await mkdir(output, { recursive: true })
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
try {
  await page.evaluate(() => { sessionStorage.setItem("newszxcn:demo-auth", "1"); location.hash = "/profile" })
  await page.reload()
  await page.getByText("admin@demo.newszxcn.com", { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => sessionStorage.getItem("newszxcn:demo-auth")), "1")
  await page.evaluate(() => { location.hash = "/profile?tab=mailboxes" })
  const tabs = page.getByRole("tablist", { name: "邮箱管理视图" })
  await tabs.waitFor()
  assert.deepEqual(await tabs.getByRole("tab").allTextContents(), ["我的邮箱", "外部邮箱", "邮件转发", "验证邮箱"])
  await tabs.getByRole("tab", { name: "我的邮箱", exact: true }).click()
  assert.equal(await page.getByRole("button", { name: "其他邮箱", exact: true }).count(), 0)
  await tabs.getByRole("tab", { name: "外部邮箱", exact: true }).click()
  assert.equal(await tabs.getByRole("tab", { name: "外部邮箱", exact: true }).getAttribute("aria-selected"), "true")
  await page.getByText("尚未添加外部邮箱", { exact: true }).waitFor()
  await page.getByRole("searchbox", { name: "搜索外部邮箱" }).fill("example")
  await page.getByRole("searchbox", { name: "搜索外部邮箱" }).fill("")
  for (const provider of ["Gmail", "Outlook"]) {
    await page.getByRole("button", { name: provider, exact: true }).click()
    await page.getByRole("dialog").waitFor()
    assert(await page.getByRole("dialog").getByText(/OAuth 只适用于/).isVisible())
    await page.getByRole("dialog").getByRole("button", { name: "返回上一级", exact: true }).click()
    await page.getByRole("dialog").waitFor({ state: "hidden" })
  }
  await page.getByRole("button", { name: "其他邮箱", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.waitFor()
  const encryption = dialog.getByRole("group", { name: "加密方式", exact: true }).getByRole("combobox")
  await encryption.click()
  assert.equal(await page.getByRole("option", { name: /不加密/ }).count(), 0, "New accounts must not offer plaintext credentials")
  await page.getByRole("option", { name: "STARTTLS", exact: true }).click()
  assert.equal(await dialog.locator('input[name="port"]').inputValue(), "143")
  await dialog.locator('input[name="port"]').fill("1993")
  await encryption.click()
  await page.getByRole("option", { name: "SSL/TLS", exact: true }).click()
  assert.equal(await dialog.locator('input[name="port"]').inputValue(), "1993", "Custom ports must survive encryption changes")
  await dialog.locator('input[name="username"]').fill("test@example.com")
  await dialog.locator('input[name="host"]').fill("imap.example.com")
  await dialog.locator('input[name="password"]').fill("not-a-real-secret")
  await dialog.getByRole("button", { name: "保存", exact: true }).click()
  await page.getByText("在线预览为只读模式，不会修改任何真实数据", { exact: true }).waitFor()
  assert(await dialog.isVisible(), "Failed save must retain the editor")
  assert.equal(await dialog.locator('input[name="username"]').inputValue(), "test@example.com")
  assert.equal(await dialog.locator('input[name="password"]').inputValue(), "not-a-real-secret")
  await dialog.locator('input[name="password"]').fill("")
  await dialog.screenshot({ path: `${output}/editor.png` })
  await dialog.getByRole("button", { name: "返回上一级", exact: true }).click()
  await dialog.waitFor({ state: "hidden" })
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme)
    const overflow = await page.evaluate(() => {
      const body = document.querySelector(".mobile-management-body")
      return body.scrollWidth > body.clientWidth + 1
    })
    assert.equal(overflow, false, `${theme}: horizontal overflow`)
    await page.screenshot({ path: `${output}/${theme}.png` })
  }
  await page.evaluate(() => document.documentElement.classList.remove("dark"))
  await page.reload()
  await tabs.getByRole("tab", { name: "外部邮箱", exact: true }).waitFor()
  assert.equal(await tabs.getByRole("tab", { name: "外部邮箱", exact: true }).getAttribute("aria-selected"), "true", "External tab must survive reload")
  assert.deepEqual(errors, [])
  console.log("PASS: external tab order, isolated native list, empty/search state, provider editors, failed-save retention, reload state, light/dark overflow")
} finally {
  await browser.close()
}
