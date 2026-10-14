# NewSzxcn App

NewSzxcn 邮箱客户端的独立开源仓库。Android 安装包与后续桌面客户端在这里维护；邮箱服务端继续在 [NewSzxcn-Email](https://github.com/zxyszx/NewSzxcn-Email) 维护。

## 下载与当前状态

从 [Releases](https://github.com/zxyszx/NewSzxcn-App/releases) 下载 APK，不需要应用商店。

**当前版本仍是离线只读演示版，不是真实邮件客户端。** 演示登录 `admin` / `admin`，不要输入真实邮箱密码。真实服务器目标为 `https://mail.newszxcn.com`，但当前 APK 尚未接入；真实收发信、附件、后台双通道推送均未完成。

- Android：可安装演示预览，Android 7.0 及以上。
- macOS：计划中，目前没有 Mac 安装包。
- 应用名称：NewSzxcn。
- Android 包名保持 `com.newszxcn.newmail`，避免仅因改名变成另一个应用。
- 目前为 debug 签名；正式签名尚未配置。签名不同的 APK 不能覆盖安装。

## 构建 Android

需要 Node.js 24、pnpm 10.28.2、Java 21、Android SDK 36。

```sh
pnpm install --frozen-lockfile
pnpm --dir apps/web android:sync:public
cd apps/web/android
./gradlew :app:assembleDebug
```

输出：`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`。

公开构建只打包允许分发的品牌素材，不包含原开发参考壁纸。不要使用 `server.url` 简单嵌入生产站点冒充完成了原生接口集成。

## 图标

`branding/app-icon.svg` 为客户端图标母版，沿用原项目的信封、S 形星轨和星光。Android 提供前景/背景分层及单色图标，通用 1024px PNG 可供后续 Mac 客户端使用。

```sh
pnpm --dir apps/web exec node ../../scripts/generate-icons.mjs
```

生成脚本需要可解析的 `sharp` 包（或通过 `SHARP_MODULE` 指定本地模块路径）。生成结果已提交，正常构建不依赖重新生成图标。

## 更新和安全

GitHub Actions 提供手动构建与检查，输出测试 APK 工件；正式发布签名和自动发布后续单独配置。CI debug 签名与本地签名可能不同，请勿混用进行覆盖升级。

请勿提交真实账户、Cookie、推送配置、服务器数据或签名私钥。安全问题请通过 GitHub 私密漏洞报告提交，不要公开密码或用户邮件。

本仓库从邮箱项目的客户端工作区提取，保留 MIT 许可证。服务端代码、数据库和部署配置不在此仓库中。
