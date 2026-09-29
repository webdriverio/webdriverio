---
id: targets
title: Session targets
description: Open a browser, mobile app, desktop app, Electron app or a cloud device with wdio session.
---

`wdio session open` starts the session. The first argument is the target. Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once. Run `npx wdio session doctor <target>` first when the target needs Appium, a desktop driver or cloud credentials.

The Chrome and Electron players drive the same [WebdriverIO demo app](https://github.com/webdriverio/native-demo-app) (the Expo guinea pig) from a local Expo web server, in a normal desktop window. Android installs the v2.2.0 release apk (`com.wdiodemoapp`) and uses `tap`, `swipe` and `fingerPrint`. iOS installs the v2.2.0 simulator app (`org.wdiodemoapp`) and uses `touchId`. The players on this page are Chrome and Electron. Each player types the command, then the window shows the result. Pause, or step to the previous or next command, to read the line that changed the window. How that app was started, including the web and Electron layout, is in [`examples/session`](https://github.com/webdriverio/webdriverio/tree/main/examples/session).

The shared path is: open the app, open the in-app WebView of the WebdriverIO frontpage, log in as `alice@webdriver.io` / `supersecret`, swipe the carousel twice to the left, scroll or swipe up to the robot logo, then finish the 9-piece puzzle. Android also logs in with the fingerprint sensor. `export` writes a Mocha spec of whichever session you just drove.

## Browsers

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session open firefox http://localhost:3000
npx wdio session open edge http://localhost:3000
npx wdio session open safari http://localhost:3000
```

Chrome opens headless. Add `--headed` to show the window. Chrome, Firefox and Edge are downloaded on first use when they are not installed. Safari requires macOS.

A headed Chrome window keeps its tab strip and address bar, which is how you tell it from an Electron window. `--viewport 1280x800` is a normal browser page. On web the app uses a left sidebar (Home, Web, Login, Forms, Swipe, Drag, Perms, Data) and the home screen lists browser and desktop next to iOS and Android. The WebView tab loads `https://webdriver.io/` inside the app. Login waits about 1.5 seconds, then opens a dialog whose text is `Success` and `You are logged in!`. `dialog accept` closes it. `swipe` is mobile-only, so the carousel move is `exec swipe-left.js` (a pointer drag across `[data-testid=Carousel]`). `scroll down --px 560` brings the WebdriverIO robot into view. The caption under it is "You found me!!!". The puzzle pieces are `aria/drag-l2` through `aria/drag-l3`, dropped on the matching `aria/drop-…` target. The tray order is `l2`, `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1`, `l3`.

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

### Native demo app

On an emulator or a device the same guinea pig is the v2.2.0 apk. `tap "~Webview"` opens the WebdriverIO frontpage in the native WebView. `tap "~Login"`, then `fill` and `tap "~button-LOGIN"`, logs in with the same email and password. The fingerprint button is `~button-biometric`. It is on the login form only after a fingerprint is enrolled. `exec -e "await browser.fingerPrint(1)"` answers the system prompt (`fingerPrint` is Android-only; there is no `wdio session` subcommand for it). `dialog accept` closes the success alert. `swipe left` pages the carousel. A second `swipe left`, then `swipe up`, reveals the robot. `drag "~drag-l2" "~drop-l2"` (and the other eight pairs, in tray order) finishes the puzzle.

`-s android` keeps this session beside the browser one. Drop `-s android` when it is the only session. `open` uses the package and activity already installed by the apk, with `--no-reset` so the enrolled fingerprint stays. `"~Webview"` is the tab's accessibility label. `swipe` is the mobile command, so Android does not use `swipe-left.js`. `wait` does not apply to a native session.

```sh
npx wdio session -s android open android --package com.wdiodemoapp --activity com.wdiodemoapp.MainActivity --no-reset
npx wdio session -s android tap "~Webview"
npx wdio session -s android tap "~Login"
npx wdio session -s android fill "~input-email" "alice@webdriver.io"
npx wdio session -s android fill "~input-password" "supersecret"
npx wdio session -s android tap "~button-LOGIN"
npx wdio session -s android dialog accept
npx wdio session -s android tap "~button-biometric"
npx wdio session -s android exec -e "await browser.fingerPrint(1)"
npx wdio session -s android dialog accept
npx wdio session -s android tap "~Swipe"
npx wdio session -s android swipe left
npx wdio session -s android swipe left
npx wdio session -s android swipe up
npx wdio session -s android tap "~Drag"
npx wdio session -s android drag "~drag-l2" "~drop-l2"
```

Repeat `drag` for `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1` and `l3`.

### iOS simulator

The same screens are in the v2.2.0 simulator build, [ios.simulator.wdio.native.app.v2.2.0.zip](https://github.com/webdriverio/native-demo-app/releases/download/v2.2.0/ios.simulator.wdio.native.app.v2.2.0.zip). Unzip it and install `wdiodemoapp.app` on a booted simulator (`xcrun simctl install booted`). The bundle id is `org.wdiodemoapp`. That binary is an iPhone Simulator app (arm64, iOS 15.1 or newer). It needs macOS and Xcode. There is no iOS player on this page.

`tap` and `swipe` match the Android flow. The biometric call is `browser.touchId(true)`, not `fingerPrint`. `touchId` needs the capability `appium:allowTouchIdEnroll` set to `true` (pass it with `--capabilities`). Enroll Touch ID on the simulator before opening the login form, or the biometric button stays hidden.

```sh
npx wdio session -s ios open ios --bundle-id org.wdiodemoapp --capabilities '{"appium:allowTouchIdEnroll":true}'
npx wdio session -s ios tap "~Webview"
npx wdio session -s ios tap "~Login"
npx wdio session -s ios fill "~input-email" "alice@webdriver.io"
npx wdio session -s ios fill "~input-password" "supersecret"
npx wdio session -s ios tap "~button-LOGIN"
npx wdio session -s ios dialog accept
npx wdio session -s ios tap "~button-biometric"
npx wdio session -s ios exec -e "await browser.touchId(true)"
npx wdio session -s ios dialog accept
npx wdio session -s ios tap "~Swipe"
npx wdio session -s ios swipe left
npx wdio session -s ios swipe left
npx wdio session -s ios swipe up
npx wdio session -s ios tap "~Drag"
npx wdio session -s ios drag "~drag-l2" "~drop-l2"
```

Repeat `drag` for the other eight pieces, in the same tray order as Android.

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

The Electron player loads the same Expo URL in a 1280×800 window with no address bar. The sidebar, login card, carousel and puzzle match the browser. `-s electron` is the session name used beside the browser demo. `dialog accept` has to run while the native alert is still open. On Electron that window is short: wait about a third of a second after `click "aria/button-LOGIN"` returns. A later `dialog accept` reports `No dialog open.` The carousel, the scroll and the puzzle use the same commands as Chrome.

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
| `MISSING_DEPENDENCY` | Install the package named in the error. `doctor <target>` prints the same install line. Electron needs `@wdio/electron-service` and `electron` in the directory you open. |
| `MISSING_APPIUM_DRIVER` | Run the `npx appium driver install …` line from the error. |
| `MISSING_BINARY` | Put the named driver (`tauri-driver` or `wdio-dioxus-driver`) on `PATH`. |
| `MISSING_CREDENTIALS` | Export the variables named in the error. |
| `NOT_SUPPORTED` | `macos` is macOS-only and `windows` is Windows-only. `swipe` is mobile-only. On Chrome and Electron, run `exec swipe-left.js`. |
| `No dialog open.` | The login alert already closed. On Electron, run `dialog accept` about a third of a second after `click "aria/button-LOGIN"` returns. |
| `"wait" is not supported for android (UiAutomator2) sessions.` | `wait` is for browser sessions. |
| `The fingerPrint command is only available for Android.` | `browser.fingerPrint` is the Android call. iOS uses `browser.touchId`. |
| `App not found:` | Pass an apk path that exists, or use `--package` and `--activity` for an app that is already installed. |
| `Pass --package <id>.` | `deeplink` needs `--package` on Android. |

## Next steps

- [Snapshots and refs](/docs/session/snapshots) — read the screen after `open`
- [Commands](/docs/session-commands) — every `open` flag
- [wdio session](/docs/session) — the default loop
