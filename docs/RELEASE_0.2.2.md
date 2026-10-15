# NewSzxcn Android 0.2.2

- Remove the duplicate refresh button in compact mailbox views.
- Handle Android back for menus, compose dialogs, message selection and folders.
- Keep list/form zoom fixed, while allowing zoom when reading mail.
- Move short in-app feedback to the bottom and prevent stacked notifications.
- Fetch notification titles using the authenticated mailbox session, without
  putting message content into the FCM payload or changing unread status.

Install over release 0.2.0/0.2.1 with the same signing identity. Local-only data
should not be cleared. Old debug-signature builds cannot be upgraded in place.

Verification: TypeScript build, six native unit tests, release build/signature,
360px browser navigation/filter checks, and temporary emulator installation/startup.
The supporting backend test suite passed before candidate deployment.

Phone acceptance is still needed for background/lock-screen notifications and
physical pinch gestures. Title lookup falls back to a generic notification when
offline or unauthenticated. Domestic push is not yet connected. The server remains
on a candidate deployment; do not run its public updater until a matching backend
release is available.
