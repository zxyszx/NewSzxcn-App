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
