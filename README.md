# NewSzxcn App

NewSzxcn 邮箱客户端的独立开源仓库。Android 安装包与后续桌面客户端在这里维护；邮箱服务端继续在 [NewSzxcn-Email](https://github.com/zxyszx/NewSzxcn-Email) 维护。

## 下载与当前状态

从 [Releases](https://github.com/zxyszx/NewSzxcn-App/releases) 下载 APK，不需要应用商店。

`0.2.0` 为正式签名的联网 APK，连接 `https://mail.newszxcn.com`，供真机验证。旧的 `0.1.1-preview` 是离线只读演示版，不支持真实收发信；不要在旧版输入真实邮箱密码。

已在模拟器验证真实登录、收发信、小附件保存与上传、自动更新，以及真实新邮件的 FCM 后台通知和点击返回邮箱。`0.2.0` 关闭 WebView 调试，仍需真机、锁屏、休眠和进程回收测试。**国内推送尚未接通，不承诺所有手机后台必达。** 详见 [联网验收说明](docs/LIVE_MAIL.md)。

- Android：Android 7.0 及以上；使用 FCM 需要可用的 Google Play 服务与网络。
- macOS：计划中，目前没有 Mac 安装包。
- 应用名称：NewSzxcn。
- Android 包名保持 `com.newszxcn.newmail`，避免仅因改名变成另一个应用。
- `0.2.0` 起使用长期发布签名。旧 debug 演示版不能直接覆盖安装；先备份本地草稿等数据，再卸载旧版并安装新版，卸载会清除本地登录及应用数据。后续官方 APK 沿用同一发布签名。

## 构建 Android

需要 Node.js 24、pnpm 10.28.2、Java 21、Android SDK 36。

```sh
pnpm install --frozen-lockfile
pnpm --dir apps/web android:sync:public
cd apps/web/android
./gradlew :app:assembleDebug
```

联网联调版将上面的同步命令替换为 `pnpm --dir apps/web android:sync:live`，再执行 Gradle 构建。两种构建使用相同包名，安装会替换现有版本，不支持同时安装。请勿把演示凭据用于联网版。

输出：`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`。

公开构建只打包允许分发的品牌素材，不包含原开发参考壁纸。不要使用 `server.url` 简单嵌入生产站点冒充完成了原生接口集成。

## 图标

`branding/app-icon.svg` 为客户端图标母版，沿用原项目的信封、S 形星轨和星光。Android 提供前景/背景分层及单色图标，通用 1024px PNG 可供后续 Mac 客户端使用。

```sh
pnpm --dir apps/web exec node ../../scripts/generate-icons.mjs
```

生成脚本需要可解析的 `sharp` 包（或通过 `SHARP_MODULE` 指定本地模块路径）。生成结果已提交，正常构建不依赖重新生成图标。

## 更新和安全

GitHub Actions 提供手动构建与检查，输出 debug 测试 APK 工件，不是签名发布包。正式签名 APK 使用仓库外保管的长期签名密钥进行本地构建；步骤见 [发布构建](docs/ANDROID_RELEASE.md)。自动签名发布尚未配置，CI debug 包不能覆盖安装正式版。

请勿提交真实账户、Cookie、推送配置、服务器数据或签名私钥。安全问题请通过 GitHub 私密漏洞报告提交，不要公开密码或用户邮件。

本仓库从邮箱项目的客户端工作区提取，保留 MIT 许可证。服务端代码、数据库和部署配置不在此仓库中。
