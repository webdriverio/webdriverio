---
id: targets
title: Session targets
description: Open a browser, mobile app, desktop app, Electron app or a cloud device with wdio session.
---

`wdio session open` starts the session. The first argument is the target. Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once. Run `npx wdio session doctor <target>` first when the target needs Appium, a desktop driver or cloud credentials.

The postcard, the boarding pass and the launch console below are files in [`examples/session`](https://github.com/webdriverio/webdriverio/tree/main/examples/session). Each player types the command, then the window shows the result. Pause, or step to the previous or next command, to read the line that changed the window. Run the commands from a checkout of the WebdriverIO repository.

## Browsers

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session open firefox http://localhost:3000
npx wdio session open edge http://localhost:3000
npx wdio session open safari http://localhost:3000
```

Chrome opens headless. Add `--headed` to show the window. Chrome, Firefox and Edge are downloaded on first use when they are not installed. Safari requires macOS.

A headed Chrome window keeps its tab strip and address bar, which is how you tell it from an Electron window. The postcard is a blank card. The city, the clock and the weather are not buttons. Start the page and leave it running:

```sh
node examples/session/serve.js browser
```

`geolocation` and `emulate color-scheme` apply on the next load, which is why `reload` comes before the stamp. `2026-12-31T15:00:00Z` is midnight in Tokyo. The page asks `GET /api/weather`. The server answers `{"condition":"clear"}` until the mock replaces it. The `aria/…` selectors are the controls `snapshot --interactive` prints, so the commands paste without copying refs. `export --out test/specs/postcard.e2e.ts` writes a Mocha spec of the steps. To make it an aurora instead of snow, mock `{"condition":"aurora"}` and click Look outside again.

<SessionTarget id="browser" />

`--viewport 1280x720` sets the initial size. `--arg` adds a browser argument and can be repeated. `--profile <dir>` keeps a profile between opens.

## Android and iOS

Android and iOS run through Appium 3. `doctor android` reports a missing server or driver with the install command.

```sh
npx wdio session doctor android
npx wdio session open android --app ./shop.apk
npx wdio session snapshot --interactive
npx wdio session tap e3
```

iOS: `open ios --bundle-id com.example.shop`. An installed Android package uses `--package` and `--activity`. Mobile web uses `--browser chrome` or `--browser safari` instead of an app. `--appium-url http://127.0.0.1:4723/` attaches to a server that is already running. A cloud app URL such as `bs://…` is passed through as `--app` and is not treated as a local file.

### Native boarding pass

The Android app is the same pass, installed on an emulator or a device. `tap` presses Board, `swipe left` flips the card, `rotate landscape` turns the device, and `deeplink` opens the aurora flight. `find` checks the status line. `wait` is for browser sessions, so it does not apply here.

Build the apk from a machine that has the Android SDK (`ANDROID_HOME`) and a running emulator or device (`adb devices` lists it):

```sh
cd examples/session/android
./gradlew assembleDebug
```

Run the session commands from that directory, which is where Gradle writes the apk. `open` installs and launches `io.webdriver.boardingpass`. `"~Board"` is the button's accessibility id. `swipe` moves across the on-screen `ScrollView`. `boardingpass://aurora` is an intent the app handles, and `--package io.webdriver.boardingpass` is the application id `deeplink` requires on Android. `export --out test/specs/boarding-pass-native.e2e.ts` writes the spec.

<SessionTarget id="android" />

### Boarding pass in the browser

The page is one boarding pass. You board, flip it over, turn it sideways, then open a different flight. On a laptop the "phone" is Chrome emulating a Pixel 7. On a device it is Chrome through Appium. Both are browser sessions, so the command is `click`. `tap`, `swipe`, `rotate` and `deeplink` are for the native app above.

On a laptop, start the page with `node examples/session/serve.js mobile`:

```sh
npx wdio session open chrome http://127.0.0.1:4174 --headed --viewport 412x839
npx wdio session emulate device "Pixel 7"
npx wdio session reload
npx wdio session click "aria/Board"
npx wdio session click "aria/Flip the pass"
npx wdio session emulate viewport 863x360
npx wdio session navigate "http://127.0.0.1:4174/?flight=aurora"
npx wdio session close
```

`emulate device` applies on the next load. `emulate viewport` changes the size immediately, so the boarded pass is still there when it becomes a stub. `863x360` is the landscape size of a Pixel 7. The aurora URL is a fresh page: the route changes to Reykjavík → Aurora.

`127.0.0.1` on a phone is the phone itself. Serve on the machine's addresses, then open the URL the server prints. Replace `192.168.1.10` with an address from that output:

```sh
node examples/session/serve.js mobile --host 0.0.0.0
npx wdio session doctor android
npx wdio session open android --browser chrome http://192.168.1.10:4174
npx wdio session click "aria/Board"
npx wdio session click "aria/Flip the pass"
npx wdio session exec -e "await browser.setOrientation('LANDSCAPE')"
npx wdio session navigate "http://192.168.1.10:4174/?flight=aurora"
npx wdio session close
```

iOS uses `open ios --browser safari` and the same clicks. `rotate` does not apply to a browser session, including Chrome on a device. `setOrientation` is the Appium call that turns the phone. If it is not a function, turn the device by hand: the pass uses the viewport's orientation and becomes a stub either way.

## Desktop apps

```sh
npx wdio session open macos --bundle-id com.example.shop
npx wdio session open windows --app Root
```

`macos` requires macOS. `windows` requires Windows. `--app Root` attaches to the desktop. An installed Windows app is named by its application id, for example `--app Microsoft.WindowsCalculator`. A path or a `.exe` is resolved as a file.

## Electron, Tauri and Dioxus

```sh
npx wdio session open electron ./main.js
npx wdio session snapshot --interactive
npx wdio session click e2
```

`open tauri ./my-app` and `open dioxus ./my-app` need their driver on `PATH` unless the service package starts the session itself. On Linux without `DISPLAY` or `WAYLAND_DISPLAY`, install Xvfb or weston. Electron stays on the classic WebDriver protocol. Pass `--app-arg` to forward a flag to the app, including `--app-arg=--no-sandbox` when the environment requires it. A value that starts with `-` has to use `=`, because the strict parser otherwise treats it as its own option.

The launch console is an Electron window with a lamp. From `examples/session/desktop`, run `npm install`, then open `./main.js`. `--app-arg=--no-sandbox` is required on Linux. On macOS and Windows the session also starts without it. Arm it, press Space, and `windows switch` moves to the telemetry window that opens beside it. `windows` lists the open windows: launch console is index 0, telemetry is index 1. `emulate` and `mock` belong to the postcard, not to this window. `export --out test/specs/launch.e2e.ts` writes the spec.

<SessionTarget id="electron" />

## Cloud devices

```sh
npx wdio session open chrome https://webdriver.io --provider browserstack
```

`--provider` is `browserstack`, `saucelabs`, `testingbot` or `testmu`. Export the provider's username and access key. `doctor <provider>` checks that they are set and does not print the values. `--tunnel` starts the provider's tunnel when the app under test is on your machine.

## A WebdriverIO config

`open` can take a config file and a capability index instead of a target name:

```sh
npx wdio session open ./wdio.conf.ts 0
```

`--hostname`, `--port`, `--path` and `--protocol` point the session at a WebDriver endpoint that is already running. Closing the session does not stop that endpoint.

## Troubleshooting

| Message | What to do |
| --- | --- |
| `MISSING_DEPENDENCY` | Install the package named in the error. `doctor <target>` prints the same install line. For the launch console, `npm install` in `examples/session/desktop`. |
| `MISSING_APPIUM_DRIVER` | Run the `npx appium driver install …` line from the error. |
| `MISSING_BINARY` | Put the named driver (`tauri-driver` or `wdio-dioxus-driver`) on `PATH`. |
| `MISSING_CREDENTIALS` | Export the variables named in the error. |
| `NOT_SUPPORTED` | `macos` is macOS-only and `windows` is Windows-only. |
| `The browser did not share a location.` | Run `geolocation` and `reload` before Stamp the card. |
| `The sky did not answer.` | Open the postcard through `serve.js`. A `file://` URL has no `/api/weather`. |
| `Text "…" did not appear` | The page status is the quoted line. `snapshot` shows the text that is actually there. |
| `Launched. The telemetry window was blocked.` | Open the console with `wdio session open electron`, not as a tab in Chrome. |
| `setOrientation is not a function` | You are not in an Appium session. On the laptop, use `emulate viewport 863x360`. |
| `"wait" is not supported for android (UiAutomator2) sessions.` | `wait` is for browser sessions. On the native pass, use `find "Now boarding WD 10."`. |
| `Default scrollable element '//android.widget.ScrollView' was not found.` | `swipe` looks for a ScrollView. The native pass has one. Another app needs its own, or a swipe inside an element from `exec`. |
| `App not found:` | Build the apk with `./gradlew assembleDebug` and pass that path to `--app`. |
| `Pass --package <id>.` | `deeplink` needs `--package io.webdriver.boardingpass` on Android. |

## Next steps

- [Snapshots and refs](/docs/session/snapshots) — read the screen after `open`
- [Commands](/docs/session-commands) — every `open` flag
- [wdio session](/docs/session) — the default loop
