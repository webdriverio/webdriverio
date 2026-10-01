# @wdio/firefox-profile-service

`FirefoxProfileLauncher#onPrepare` encodes a Firefox profile and writes it to
`moz:firefoxOptions.profile`. Tests live in `tests/launcher.test.ts`.

- Drive the service through `onPrepare`. Empty options must use a Firefox
  capability. A non-Firefox capability stays unchanged even if that early
  return is removed, so it does not prove the return.
- `profileDirectory` is not a Firefox preference. Assert that `setPreference`
  is not called for it. `FirefoxProfile.copy` is the proof this option uses
  the async copy API: the shared mock encodes every profile as `foobar`, so
  the capability string cannot tell copy from `new Profile()`.
- Do not call `_setPreferences` or `_buildExtension` just to hit a missing
  profile. `firefox-profile` `copy` resolves to a profile or rejects.
  `onPrepare` narrows the optional callback result once; the helpers assume
  that already happened.
