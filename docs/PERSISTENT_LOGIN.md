# 持久登录

App 与服务端需要配套更新。新服务端在 `/api/public/settings` 返回
`rememberDeviceHours`，App 才显示并发送 `rememberDevice` 登录选项；旧服务端
不收到新字段，仍按原策略登录，不会因未知字段报错。

- 普通登录仍使用 `LANQIN_SESSION_TTL_HOURS`，默认 7 天。
- 勾选“在此设备保持登录”使用 `LANQIN_REMEMBER_DEVICE_TTL_HOURS`，默认 2160 小时
  （90 天），服务端上限 90 天。设置为 0 可禁用。若不大于普通会话期限，也不启用。
- App 默认勾选；网页版默认不勾选。双因素验证仍必须完成。
- 仍使用服务器存储哈希的随机会话令牌及 HttpOnly Cookie，不保存账号密码。
- 退出当前账号撤销当前会话；修改、重置密码撤销该用户的所有会话。
- 到期仍需重新登录。这不是无限期登录，也不会延长既有会话。
- Android 切入后台时执行 CookieManager.flush，将登录、退出状态写入持久存储。

部署顺序：先备份并更新服务端，再更新 APK。已有过期会话需要重新登录一次，
不会自动恢复。回滚旧服务端后，新 APK 隐藏此选项并省略新字段；已签发会话
仍使用原 sessions 表，不需要数据库迁移。回滚本身不会撤销已签发的长会话。

本地自动检查覆盖普通会话过期、持久会话到期、保存 Cookie 后重新打开客户端、
主动退出和改密码后的旧 Cookie 重放。发布前还应在真机验证应用进程回收、
重启手机及覆盖安装后的登录状态。

Android 仪器测试使用保留域 `.invalid` 和非认证测试值，不读取真实登录 Cookie。
在隔离模拟器安装 debug APK 和 androidTest APK 后，按顺序运行：

```sh
adb shell am instrument -w -e sessionPersistencePhase save -e class com.newszxcn.newmail.PersistentLoginTest#saveOnStop com.newszxcn.newmail.test/androidx.test.runner.AndroidJUnitRunner
adb shell am force-stop com.newszxcn.newmail
adb shell am instrument -w -e sessionPersistencePhase restore -e class com.newszxcn.newmail.PersistentLoginTest#restoreAfterProcessDeath com.newszxcn.newmail.test/androidx.test.runner.AndroidJUnitRunner
```

第一步通过 Activity 停止触发 App 自身的 Cookie 保存；第二次仪器调用启动新进程，
验证之前的持久 Cookie 可恢复。不要用普通整类测试代替这两次独立调用。
未传入阶段参数时，这两项测试会跳过，避免普通整套测试以错误顺序执行。

2026-10-27 本地验证：服务端会话测试、网页兼容测试、APK 与仪器测试包编译通过。
API 37 模拟器两次出现 BIND APPLICATION ANR，测试进程初始化未完成，尚未完成
跨进程 Cookie 恢复验收，不能据此声称真机长时间登录已通过验证。
