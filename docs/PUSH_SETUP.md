# 双通道推送配置清单

目前已实现 Android 原生通知、FCM SDK、登录绑定的设备注册，以及服务端持久化投递队列，并通过本地测试。服务端 FCM 候选版本已部署；Google 服务模拟器上的真实收信后台通知已通过。国内 SDK、真机、锁屏和进程回收验收尚未完成，不能称为双通道全部接通。

2026-10-15：项目 ID 为 `newszxcn`，包名为 `com.newszxcn.newmail`。客户端配置已放入本机被 Git 忽略的路径。令牌仅存于 Android 私有存储，不输出到网页、聊天或日志；仅联网构建在用户登录并允许通知后启用自动初始化。退出时清除本地状态并请求删除 FCM 令牌；本地服务端测试已验证退出会话会级联撤销设备及队列任务，该行为尚待生产部署验收。

专用发送服务账号已创建，并确认只授予包含 `cloudmessaging.messages.create` 的自定义角色。私钥已保存至仓库外 `/Users/yu/.config/newszxcn/push/firebase-service-account.json`，权限为 `0600`；Google OAuth 身份认证检查通过，未输出访问令牌。私钥已独立上传到服务器受限目录，以只读挂载供候选 API 使用。现有安装由服务器一键脚本管理反代，不在 1Panel 网站列表内；此次部署没有改动反代。

同日候选部署：服务器保留旧镜像、配置与经过完整性校验的数据库备份后，仅替换 API。模拟器注册成功；用户发送真实测试邮件后，服务端推送任务一次成功，原生接收器接受对应事件，后台系统通知显示“收到新邮件，点击查看”。点击通知后进入邮箱路由，登录仍有效，邮件仍为未读。上述链路测试使用本地 debug 包；`0.2.0` 发布包改用长期正式签名并关闭 WebView 调试，供真机测试。服务器候选尚未发布为公开镜像；测试期间不要执行 `ns update` 或网页更新，以免公开镜像覆盖候选配置。

同日已通过 Firebase 控制台仅向该模拟器发送一条通用测试通知。应用处于后台时，系统通知记录和通知栏截图均确认收到，证明控制台到该设备的 FCM 传输可用。此测试使用控制台通知消息，不覆盖真实邮件入库触发、data-only 接收器、进程回收、锁屏或国内真机。Cloud Messaging HTTP v1 API 已在控制台确认启用；没有发布面向全部用户的宣传活动，也没有启用付费方案。

## 应用资料

| 项目 | 填写内容 |
| --- | --- |
| 名称 | NewSzxcn |
| 平台 | Android |
| 包名 | com.newszxcn.newmail |
| 官网 | https://mail.newszxcn.com |
| 分发 | GitHub APK；尚未上架商店 |
| 签名 | `0.2.0` 起使用长期发布签名，旧 debug 包不能覆盖升级 |

如平台要求签名指纹，必须从最终实际安装的 APK 或签名证书提取。不要把 CI 临时 debug 证书当作正式证书。正式签名与目前签名不同会影响覆盖升级，需要另行安排迁移；不要删除现有签名密钥。

## 1. Google 通道

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 创建项目，名称可填 NewSzxcn；记录项目 ID。
2. 添加 Android 应用，包名严格填写 `com.newszxcn.newmail`。不要创建成 Web 应用。
3. 下载 `google-services.json`，放到 `apps/web/android/app/google-services.json`。该文件已被 Git 忽略；它是客户端配置，不是服务端私钥。
4. 检查项目的 Firebase Cloud Messaging API（HTTP v1）已启用。无需为邮箱推送额外开启 Analytics、Firestore 或 Firebase Authentication。
5. 为邮箱服务器准备专用、最小权限的发送身份，不授予项目 Owner/Editor。非 Google 托管服务器如必须使用 JSON 私钥，将文件保存在服务器受限目录，不放进 APK、前端变量或 Git。可先安全保存到本机仓库外 `/Users/yu/.config/newszxcn/push/firebase-service-account.json`，告知文件路径即可，不要粘贴内容。该目录需要自行创建，文件仅账号所有者可读。

参考：[Android 注册与配置](https://firebase.google.com/docs/android/setup)、[HTTP v1 服务端认证](https://firebase.google.com/docs/cloud-messaging/send/v1-api)。有 Google 服务的真机用于这一通道的验收。

## 2. 国内通道

候选方案为极光 JPush（尚未开通或集成）。先检查其账号资质、隐私条款、费用和 GitHub 分发应用的接入条件，再决定是否采用，不必直接购买付费套餐。

1. 在平台控制台创建 Android 推送应用，名称、包名与上表一致。
2. 准备应用 AppKey；Master Secret 仅保存在服务器或仓库外的受限本机文件中，不能进入 APK。
3. 如需进程退出、休眠后的厂商系统通道，按目标品牌开通对应厂商推送应用，并在聚合平台配置其应用标识及凭据。开通聚合平台本身不代表华为、小米、OPPO、vivo、荣耀等厂商通道已经可用；资格要求按各平台审核结果为准。
4. 根据控制台要求提供最终签名信息、应用介绍、隐私政策、APK 或其他审核资料；未通过审核的通道不能算作已接通。
5. 国内通道凭据可暂存在仓库外 `/Users/yu/.config/newszxcn/push/` 下，仅告知路径；不要上传聊天或 GitHub。

参考：[极光 Android 接入说明](https://docs.jiguang.cn/jpush/client/Android/android_guide)。无 Google 服务的国内 Android 真机用于这一通道的验收。

## 3. 准备完成后告知的信息

- Firebase 项目 ID、客户端配置文件已放好。
- 服务端凭据存放路径（不是内容）。
- 国内平台名称、应用已创建、哪些厂商通道已审核通过。
- 用于测试的手机品牌、Android 版本、是否有 Google 服务。

## 后续开发与验收

服务端已部署候选版本，设备注册、真实邮件触发、后台通知与点击返回邮箱已在模拟器验证。令牌轮换、退出撤销、账号切换、锁屏、进程回收与网络恢复仍需生产或真机验收；对应权限、撤销和队列行为已有本地测试。FCM 接收器只接受 `type=new_mail`、合法 `event_id` 和匹配当前登录的 `binding_id`，对事件去重后显示通用提示。国内 SDK 尚未接入。Firebase 控制台的通知消息仅适合单设备传输诊断，不替代真实邮件触发链路验收。

前台、切后台、锁屏、系统休眠、进程被回收要分别测试。用户在系统中强制停止应用、禁用通知或限制后台时，不能承诺必达。推送仅显示通用提示，不携带正文、验证码、主题或发件人。先通过服务端鉴权再读取邮件。
