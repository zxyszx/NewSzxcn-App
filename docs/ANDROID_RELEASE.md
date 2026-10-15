# Android Release Build

The `0.2.0` APK is a release build with a dedicated long-term signing identity,
not the old debug certificate. Release signing does not mean every device or
domestic push channel has been accepted. Verify those scenarios separately.

## Build

Use Java 21 and Android SDK/build-tools 36. Put this project's client Firebase
configuration in ignored `apps/web/android/app/google-services.json`. It is client
configuration, not a Firebase service-account private key. Never put server keys,
real mailbox data, sessions or passwords in the APK or repository.

```sh
pnpm install --frozen-lockfile
env -u NEWSZXCN_WEBVIEW_DEBUG pnpm --dir apps/web android:sync:live
cd apps/web/android
./gradlew :app:testReleaseUnitTest :app:assembleRelease --console=plain
```

The unsigned artifact is `app/build/outputs/apk/release/app-release-unsigned.apk`.
Run `zipalign`, sign with `apksigner`, then verify the signature and alignment.
Read signing passwords from a restricted file or secure input, never command-line
password literals, logs or environment files in this repository.

The owner's long-term key and password are kept separately under the private
local configuration directory, outside Git. Back them up to secure storage before
depending on update continuity. Losing the signing key prevents future APK updates
under the same application identity. Never regenerate it for a routine release.

## Verify And Publish

- Confirm package `com.newszxcn.newmail`, expected version/code, and
  `android:debuggable=false`. Verify embedded native config enables live mail and
  disables WebView debugging. Check FCM client resources are present.
- Audit the final APK for service-account keys, signing files, private wallpapers
  and runtime data. Publish only the signed APK and its SHA-256 checksum.
- Attach it to a release tag containing the corresponding source, with truthful
  acceptance notes. The GitHub Actions debug artifact is not a substitute.
- `0.2.0` uses versionCode `4`. Increasing versions must retain the release key.
- Old debug builds need uninstall before installing this release certificate.
  Uninstall clears app data; back up local-only drafts first. Do not silently
  uninstall the user's authenticated app during tests.
- Current server FCM support is deployed as a candidate, not public `latest`.
  Avoid the server's `ns update` / web updater until its source release is ready.

## 0.2.0 Verification

- Release unit tests: 6 passed; release build and vital lint passed.
- APK version: `0.2.0` / code `4`, Android 7.0+, all four Android ABIs.
- APK v2/v3 signature and ZIP alignment verified; live mode enabled,
  WebView debugging disabled, FCM configured, no debuggable manifest flag.
- APK contents checked for private wallpaper assets, service-account private
  keys, signing files and signing password; none found.
- The signed APK installed and cold-started successfully in a temporary
  read-only Google Play emulator copy; the real login form rendered correctly.
  The existing authenticated test emulator was not uninstalled or modified.
- Release signing certificate SHA-256:
  `8bfd627e22822e7194a7669b3269721f46ec5d3906214f4d8429da22256410ef`.
- Real mail and background FCM acceptance was performed on the preceding debug
  build; the signed release still needs the user's real-phone acceptance.

## 0.2.1 Layout Verification

- Version code `5`; same signing certificate as `0.2.0` for in-place updates.
- Playwright checked visible dates and document bounds at 320, 360, 375, 430,
  700 and 1440 CSS pixels; no dates outside the viewport or document overflow.
- Both list renderers now use the existing date grouping (today, yesterday,
  this week, this month, older). Group-label checks passed.
- In `0.2.1`, native `android.zoomEnabled` was true, without disabling viewport scaling;
  the final live APK retains debugging disabled. Physical pinch gestures still
  need confirmation on the user's phone.
- Release build and all 6 native unit tests passed. Signed APK installation and
  startup were checked on a temporary read-only emulator, preserving the
  authenticated test environment.

## 0.2.2 Interaction And Notification Checks

- Version code `6`, retaining the release signing certificate for updates.
- Native shell zoom is off for lists and forms; reading a message enables zoom,
  and leaving the reader resets it. Web viewport scaling remains available.
- Compact layout has one refresh button. Browser checks at 360 CSS pixels covered
  unread filtering, compose dismissal, draft navigation and Sent/Archive/Trash/
  Starred/Spam filtering and return navigation. They used isolated demo data,
  not real outgoing mail or production draft mutations.
- Android back first dismisses overlays, then the reader or selection; folder
  views return to Inbox before native history/exit handling.
- Toasts are limited to one bottom entry lasting three seconds. Native foreground
  incoming mail does not emit a second toast, sound or system notification.
- FCM carries an opaque event ID. The App fetches the subject over fixed-origin
  HTTPS using its existing session. The server enforces device-session and mailbox
  ownership and does not mark the message read. Failed preview requests fall back
  to generic notification text; lock-screen public text remains generic.
- Backend tests include anonymous access, cross-session denial, logout revocation,
  title sanitization, no-store caching and unchanged unread state. The full backend
  suite and the six native release unit tests passed.
- Physical-phone background delivery, title display and pinch gestures still
  require acceptance after upgrading. Domestic push is not connected.
- The backend preview service is a candidate override layered over the previous
  FCM candidate. Roll back by starting the base compose plus the previous push
  override without the preview override; do not restore an older mailbox database.

## 0.2.3 Mailbox Notification Layout

- Version code `7`, same release signing certificate. Notifications put the
  receiving mailbox address above the subject, without a fixed click-to-view line.
- The authenticated preview endpoint adds `mailboxAddress`; existing clients may
  ignore it. The exact registered session and mailbox ownership are still required.
- Native tests cover the two-line mapping, empty subjects, older servers, generic
  fallback, control characters and Unicode-safe truncation. All nine native tests
  and the release build passed. Backend push tests passed, including ownership,
  expiry and inactive mailbox checks. No real outgoing email was sent for tests.
- Public lock-screen content remains generic. Physical-phone rendering needs
  confirmation with a real incoming message after upgrading.
- Server candidate `fcm-account-20261015` is layered over the preview candidate.
  To roll back, omit `compose.account.yml` and keep the base, push and preview
  overrides; retain current mailbox data rather than restoring an older database.
