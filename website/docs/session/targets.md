---
id: targets
title: Session targets
description: Open a browser, mobile app, desktop app, Electron app or a cloud device with wdio session.
---

`wdio session open` starts the session. The first argument is the target. Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once. Run `npx wdio session doctor <target>` first when the target needs Appium, a desktop driver or cloud credentials.

The Chrome, Android and Electron players drive the same [WebdriverIO demo app](https://github.com/webdriverio/native-demo-app) (the Expo guinea pig). Chrome and Electron use a local Expo web server in a normal desktop window. Android installs the v2.2.0 release apk (`com.wdiodemoapp`). iOS installs the v2.2.0 simulator app (`org.wdiodemoapp`) and uses `touchId`. Each player types the command, then the window shows the result. Pause, or step to the previous or next command, to read the line that changed the window. How that app was started, including the web and Electron layout, is in [`examples/session`](https://github.com/webdriverio/webdriverio/tree/main/examples/session).

The shared path is: open the app, log in as `alice@webdriver.io` / `supersecret`, reach the robot logo ("You found me!!!"), then finish the 9-piece puzzle. Chrome and Electron also set a location and a night clock on the Weather view, open the in-app WebView of the WebdriverIO frontpage, and drag the carousel. The Android player scrolls the native swipe screen to that robot. `export` writes a Mocha spec of whichever session you just drove.

## Browsers

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session open firefox http://localhost:3000
npx wdio session open edge http://localhost:3000
npx wdio session open safari http://localhost:3000
```

Chrome opens headless. Add `--headed` to show the window. Chrome, Firefox and Edge are downloaded on first use when they are not installed. Safari requires macOS.

A headed Chrome window keeps its tab strip and address bar, which is how you tell it from an Electron window. `--viewport 1280x800` is a normal browser page. On web the app uses a left sidebar. The WebdriverIO logo is at the top of that sidebar. The items are Home, Weather, Web, Login, Forms, Swipe, Drag, Perms and Data. The home screen lists browser and desktop next to iOS and Android.

Weather reads `navigator.geolocation` and `Date`. `geolocation 35.6762 139.6503` is Tokyo. It applies on the next load, so run `reload` before `click "aria/Weather"`. The widget then shows Tokyo, 21° and rain. `emulate clock 2026-06-21T23:30:00Z` switches the same card from a day sky to a night sky and sets the clock to 11:30 PM. A second `emulate clock` replaces the first.

The WebView tab loads `https://webdriver.io/` inside the app. Login waits about 1.5 seconds, then opens a dialog whose text is `Success` and `You are logged in!`. The LOGIN button stays a 200×50 orange control while that wait is on screen. `dialog accept` closes the dialog. `swipe` is mobile-only. Drag `[data-testid=Carousel]` onto `aria/Next card` twice to page the carousel. `scroll down --px 560` brings the WebdriverIO robot into view. The caption under it is "You found me!!!". The puzzle pieces are `aria/drag-l2` through `aria/drag-l3`, dropped on the matching `aria/drop-…` target. The tray order is `l2`, `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1`, `l3`.

```sh
npx wdio session open chrome http://127.0.0.1:8081 --headed --viewport 1280x800
npx wdio session geolocation 35.6762 139.6503
npx wdio session reload
npx wdio session click "aria/Weather"
npx wdio session emulate clock 2026-06-21T23:30:00Z
npx wdio session click "aria/Webview"
npx wdio session click "aria/Login"
npx wdio session fill "aria/input-email" "alice@webdriver.io"
npx wdio session fill "aria/input-password" "supersecret"
npx wdio session click "aria/button-LOGIN"
npx wdio session dialog accept
npx wdio session click "aria/Swipe"
npx wdio session drag "[data-testid=Carousel]" "aria/Next card"
npx wdio session drag "[data-testid=Carousel]" "aria/Next card"
npx wdio session scroll down --px 560
npx wdio session click "aria/Drag"
npx wdio session drag "aria/drag-l2" "aria/drop-l2"
```

Repeat `drag` for `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1` and `l3`.

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

On an emulator or a device the same guinea pig is the v2.2.0 apk. `open` waits up to five minutes. UiAutomator2 installs a server and starts instrumentation before the app is usable, and that is slower than launching a browser. The first request is not retried: a retry starts a second Appium session on the same device while the first is still installing. `tap "~Login"`, `fill`, then `tap "~button-LOGIN"` logs in with the same email and password. On a short screen the LOGIN button sits below the fold, so scroll the `~Login-screen` before that tap. `dialog accept` closes the success alert, and it has to run after that alert is on screen. The alert text is `Success` / `You are logged in!`.

The fingerprint button is `~button-biometric`. It is on the login form only after a fingerprint is enrolled, so this player does not tap it. `exec -e "await browser.fingerPrint(1)"` answers the system prompt (`fingerPrint` is Android-only; there is no `wdio session` subcommand for it).

`tap "~Webview"` is the in-app WebView of `https://webdriver.io/`. On a one-CPU software emulator the WebView renderer dies with `SIGTRAP` in `libmonochrome` after the LOADING label, and the page never paints. The player leaves that tab alone.

`tap "~Swipe"` opens the carousel. `swipe left` does not page it: the carousel is `react-native-reanimated-carousel`, and a UIAutomator swipe springs back to the first card. An `exec` of `mobile: swipeGesture` on the scroll view, repeated, is what brings up the robot and the caption "You found me!!!". A full-screen `swipe up` from the bottom edge opens Android's screenshot UI instead. `drag "~drag-l2" "~drop-l2"` (and the other eight pairs, in tray order) finishes the puzzle. The last frame is the assembled robot and the retry control.

`-s android` keeps this session beside the browser one. Drop `-s android` when it is the only session. `open` uses the package and activity already installed by the apk, with `--no-reset` so an enrolled fingerprint stays. `"~Login"` is the tab's accessibility label. `wait` does not apply to a native session.

```sh
npx wdio session -s android open android --package com.wdiodemoapp --activity com.wdiodemoapp.MainActivity --no-reset
npx wdio session -s android tap "~Login"
npx wdio session -s android fill "~input-email" "alice@webdriver.io"
npx wdio session -s android fill "~input-password" "supersecret"
npx wdio session -s android exec -e 'await browser.execute("mobile: scrollGesture", { elementId: (await $("~Login-screen")).elementId, direction: "down", percent: 0.75 }); return "scrolled the login form"'
npx wdio session -s android tap "~button-LOGIN"
npx wdio session -s android dialog accept
npx wdio session -s android tap "~Swipe"
npx wdio session -s android exec -e 'for (let i = 0; i < 6; i++) { await browser.execute("mobile: swipeGesture", { left: 80, top: 180, width: 560, height: 320, direction: "up", percent: 0.95 }) } for (let i = 0; i < 4; i++) { await browser.execute("mobile: swipeGesture", { left: 40, top: 700, width: 640, height: 280, direction: "up", percent: 0.9 }) } return "revealed the robot"'
npx wdio session -s android tap "~Drag"
npx wdio session -s android drag "~drag-l2" "~drop-l2"
```

Repeat `drag` for `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1` and `l3`.

<SessionTarget id="android" />

### iOS simulator

The same screens are in the v2.2.0 simulator build, [ios.simulator.wdio.native.app.v2.2.0.zip](https://github.com/webdriverio/native-demo-app/releases/download/v2.2.0/ios.simulator.wdio.native.app.v2.2.0.zip). Unzip it and install `wdiodemoapp.app` on a booted simulator (`xcrun simctl install booted`). The bundle id is `org.wdiodemoapp`. That binary is an iPhone Simulator app (arm64, iOS 15.1 or newer). It needs macOS and Xcode. There is no iOS player on this page.

Login, swipe and drag use the same accessibility labels as Android. `swipe left` was not run on the simulator. On the Android apk it does not page this carousel. The biometric call is `browser.touchId(true)`, not `fingerPrint`. `touchId` needs the capability `appium:allowTouchIdEnroll` set to `true` (pass it with `--capabilities`). Enroll Touch ID on the simulator before opening the login form, or the biometric button stays hidden.

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

The Electron player loads the same Expo URL in a 1280×800 window with no address bar. The logo, sidebar, weather card, login card, carousel and puzzle match the browser. `-s electron` is the session name used beside the browser demo. Electron stays on the classic protocol, so `geolocation` and `emulate clock` go through Chromedriver instead of BiDi. The commands match Chrome, including `reload` before Weather, except the success dialog. On Linux, `dialog accept` accepts the native alert and the bubble stays painted. That bubble is not part of the page, so a later click cannot reach it. The recording replaces `window.alert` with an in-page dialog and runs `click "aria/OK"`. The LOGIN button stays a 200×50 orange control while it waits. The carousel, the scroll and the puzzle use the same commands as Chrome.

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
| `NOT_SUPPORTED` | `macos` is macOS-only and `windows` is Windows-only. `swipe` is mobile-only. On Chrome and Electron, drag `[data-testid=Carousel]` onto `aria/Next card`. |
| `No dialog open.` | The alert is not open. On Android, wait until the success alert is visible before `dialog accept`. On Linux Electron the native bubble can stay painted after `acceptAlert` and still report no dialog. The player uses an in-page dialog and `click "aria/OK"` instead. |
| `The instrumentation process cannot be initialized` | UiAutomator2 did not start listening in time. The session already waits 240s for it. On a software emulator, one CPU and a 720×1280 skin gets the v2.2.0 apk to the home screen. A 1080×2400 image with two CPUs ANRs `system_server` and the server never listens. |
| `Request timed out! Consider increasing the "connectionRetryTimeout" option.` | The client gave up while Appium was still creating the session. Android and iOS wait 300s for that first request and do not send it again. |
| `"wait" is not supported for android (UiAutomator2) sessions.` | `wait` is for browser sessions. |
| `The fingerPrint command is only available for Android.` | `browser.fingerPrint` is the Android call. iOS uses `browser.touchId`. |
| `App not found:` | Pass an apk path that exists, or use `--package` and `--activity` for an app that is already installed. |
| `Pass --package <id>.` | `deeplink` needs `--package` on Android. |

## Next steps

- [Snapshots and refs](/docs/session/snapshots) — read the screen after `open`
- [Commands](/docs/session-commands) — every `open` flag
- [wdio session](/docs/session) — the default loop
