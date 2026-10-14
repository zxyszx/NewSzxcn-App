# Android demo

This document describes the original preview. The independent client is now
named NewSzxcn; see the repository README for current build and release status.

This initial Capacitor application packages the existing read-only demo locally.
It does not connect to the production mailbox API. Login: `admin` / `admin`
(public demo credentials only). Sending and mutations are rejected by the demo API.

## Build and run

Requirements: Node.js 22+, pnpm, Android Studio, Android SDK 36, and Java 21.
The generated Gradle 8.14.3 wrapper does not support Java 25, which is bundled
with some Android Studio releases. Select Java 21 as the project's Gradle JDK.

From `apps/web`:

```sh
pnpm install
pnpm android:sync
pnpm android:open
```

Open the generated `apps/web/android` project, allow Gradle sync, select an
emulator, and run `app`. The first sync downloads Android build dependencies.

On this Mac, a separate Java 21 runtime was installed without changing the system
Java default. To build and run on the existing emulator from `apps/web`:

```sh
JAVA_HOME=/Users/yu/Library/Caches/newszxcn-tools/java21/Contents/Home \
ANDROID_HOME=/Users/yu/Library/Android/sdk \
pnpm exec cap run android --target emulator-5554 --no-sync
```

The application name is `Newmail` and its selected application ID is
`com.newszxcn.newmail`. This remains a read-only development build using debug
signing, not a production mail client. It installs separately from the old
`com.newszxcn.email.demo` package; existing demo data is not migrated or deleted.
The independent native preview package is unchanged. Web assets use a separate
`dist-mobile` directory, built with `VITE_DEMO_MODE=true` and root asset paths.
Always run `android:sync` after changing the web code. Ordinary web builds do
not update the Android application.

## Scope and limitations

For a GitHub preview without development-reference wallpapers, run
`pnpm android:sync:public` instead of `pnpm android:sync`, then build
`./gradlew :app:assembleDebug` from `apps/web/android` with Java 21.
This allowlists app branding assets and uses a plain background. The public
APK is still debug-signed and read-only; it does not provide background push.

- This is a development preview, not a production release or signed store build.
- Only Android is generated in this phase; iOS will require Xcode and signing.
- Real login, API origin, cookies, attachments, notifications, external links,
  and native back navigation need separate integration and verification before
  enabling production mail. Do not add a production `server.url` as a shortcut.
- Do not bundle server credentials or signing keys. Cleartext network traffic
  and Android application backups are disabled.
- Remove the installed demo normally through Android Settings to undo installation.
- Opening a message attempts to mark it read. The demo rejects this mutation and
  currently displays a read-only error toast; this is not a production API error.
- The existing demo message-list API ignores search parameters. Searching still
  returns the fixed demo list; search behavior is not validated by this preview.

## Verified locally

- TypeScript and both ordinary web and mobile builds completed successfully.
- Android debug APK compiled, installed, and launched on the API 37 ARM64 emulator.
- Demo login and the six-message inbox rendered at a 411 x 866 CSS-pixel viewport
  without horizontal overflow. Message detail navigation was exercised.
- Real email delivery, attachments, notifications, and release signing were not tested.
