---
id: targets
title: Session targets
description: Open a browser, mobile app, desktop app, Electron app or a cloud device with wdio session.
---

`wdio session open` starts the session. The first argument is the target. Reuse the `default` session. Pass `-s <name>` only when you need two sessions at once. Run `npx wdio session doctor <target>` first when the target needs Appium, a desktop driver or cloud credentials.

## Browsers

```sh
npx wdio session open chrome http://localhost:3000
npx wdio session open firefox http://localhost:3000
npx wdio session open edge http://localhost:3000
npx wdio session open safari http://localhost:3000
```

Chrome opens headless. Add `--headed` to show the window. Chrome, Firefox and Edge are downloaded on first use when they are not installed. Safari requires macOS.

A headed Chrome window keeps its tab strip and address bar, which is how you tell it from an Electron window. This is the [postcard demo](/docs/session/demos). The terminal types each command, then the window changes.

```sh
npx wdio session open chrome http://127.0.0.1:4173 --headed
npx wdio session geolocation 35.6762 139.6503
npx wdio session emulate color-scheme dark
npx wdio session reload
npx wdio session click "aria/Stamp the card"
npx wdio session emulate clock 2026-12-31T15:00:00Z
npx wdio session mock "**/api/weather" --body '{"condition":"snow"}'
npx wdio session click "aria/Look outside"
npx wdio session fill "aria/Message" "Wish you were here"
npx wdio session click "aria/Send the card"
```

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

The native [boarding pass](/docs/session/demos#native-boarding-pass) is an Android app. `tap`, `swipe`, `rotate` and `deeplink` each change the pass.

```sh
npx wdio session open android --app app/build/outputs/apk/debug/app-debug.apk
npx wdio session tap "~Board"
npx wdio session swipe left
npx wdio session rotate landscape
npx wdio session deeplink "boardingpass://aurora" --package io.webdriver.boardingpass
```

<SessionTarget id="android" />

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

The [launch console](/docs/session/demos#launch-console) is an Electron window. Arm it, press Space, and `windows switch` moves to the telemetry window that opens beside it.

```sh
npx wdio session open electron ./main.js --app-arg=--no-sandbox
npx wdio session click "aria/Arm"
npx wdio session press Space
npx wdio session windows switch 1
```

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
| `MISSING_DEPENDENCY` | Install the package named in the error. `doctor <target>` prints the same install line. |
| `MISSING_APPIUM_DRIVER` | Run the `npx appium driver install …` line from the error. |
| `MISSING_BINARY` | Put the named driver (`tauri-driver` or `wdio-dioxus-driver`) on `PATH`. |
| `MISSING_CREDENTIALS` | Export the variables named in the error. |
| `NOT_SUPPORTED` | `macos` is macOS-only and `windows` is Windows-only. |

## Next steps

- [Snapshots and refs](/docs/session/snapshots) — read the screen after `open`
- [Commands](/docs/session-commands) — every `open` flag
- [wdio session](/docs/session) — the default loop
