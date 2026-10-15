# NewSzxcn Android 0.2.3

- Incoming notifications show the receiving mailbox address on the first line
  and the email subject on the second line, instead of a fixed click-to-view text.
- Empty subjects use a no-subject placeholder. When preview lookup fails, the
  generic notification remains available. Older title-only servers are supported.
- Lock-screen public content remains generic. Neither mailbox addresses nor
  subjects are included in the FCM payload: preview lookup still requires the
  exact registered login session and mailbox ownership, without marking mail read.

Version code 7 retains the previous release signing identity for in-place updates.
The new layout requires the matching backend candidate. Real-phone display needs
confirmation with a newly received email; a synthetic channel test has no linked
mail preview. Domestic push is not yet connected.
