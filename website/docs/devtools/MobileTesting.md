---
id: mobile
title: Mobile Testing
---

DevTools captures Appium sessions in both live mode and [Trace Mode](/docs/devtools/wdio/trace-mode). What it captures depends on one question — **does this session have a web document right now?** — because every DOM drain, page script and viewport read is a round trip that can only fail without one.

## Three kinds of session

| Session | Has a document | What is captured |
|---|---|---|
| **Mobile browser** (Chrome on Android, Safari on iOS) | always | the same as a desktop run — DOM time-travel, console, network, replay |
| **Native app** | never | commands, screenshots and element data from the platform's XML tree; no DOM |
| **Hybrid app** | only while in a webview context | native halves as an app, webview halves as a page |

The discriminator is the **browser name in the capabilities**, not the device: a mobile browser states one, a native app states none. A device is not required either — a Mac2, WinAppDriver or tvOS session has no document and is treated the same way.

## Hybrid apps and the active context

A hybrid app is the case capabilities alone cannot answer, because the answer changes during the run. Appium reports either `NATIVE_APP` or a webview context, and **anything that is not `NATIVE_APP` counts as a webview** — the `WEBVIEW_` prefix is a convention, and a driver naming its webview differently would otherwise have its DOM capture skipped.

Following the context costs no extra round trip: the context-switch command carries its destination in its own arguments, and a switch that failed is ignored.

## Adapter support

All four adapters detect a native session and skip page-side capture on one. They differ on hybrid apps:

| Capability | WebdriverIO | Selenium | Nightwatch | Python |
|---|---|---|---|---|
| Native session detected, page-side capture skipped | ✅ | ✅ | ✅ | ✅ |
| Follows a hybrid app into its webview | ✅ | ⚠️ ¹ | ⚠️ ¹ | ⚠️ ¹ |

¹ Answers from the startup capabilities only, so a hybrid session's webview half is captured as if it were still native — no DOM for those actions.

The **device itself** needs no adapter support: it is derived from the session's capabilities by the shared trace exporter on the way into the archive, and by the dashboard for a live session whose adapter sent none. Every adapter therefore gets the device frame.

## In the dashboard

A phone capture is framed as the device: a full-height device column with the action list and dock beside it, in **both** live mode and the [trace player](/docs/devtools/trace-player). The trace's `context-options` records the platform, model and OS version, read back on open so the player labels frames without guessing.

On a native session the A11y tab and element data come from the platform's XML tree rather than the DOM, so locators read as `android=new UiSelector()…` or `-ios predicate string:…` rather than CSS or XPath over HTML.

## What a mobile trace does not contain

Per-action snapshots are issued from inside the command hook, and Appium serialises a probe behind the command it is observing. Where a session has a document to probe, that snapshot is therefore skipped.

In practice: **a hybrid app's webview actions carry no per-action element data, accessibility tree or settle screenshot.** Native sessions, mobile browsers and every desktop session are unaffected. Command rows and their screenshots, console, network and the archive itself are always captured.

These absences are by design. They are not a capture failure, and they are the main thing to know before debugging a hybrid trace.

## Running an example

The repo carries one mobile example per adapter, and all four drive the same
flow, so a difference between two dashboards is a difference in the adapter
rather than in the test:

```sh
pnpm demo:wdio:mobile
pnpm demo:selenium:mobile
pnpm demo:nightwatch:mobile
pnpm demo:python:mobile
```

They drive the **Clock app**, which ships with every Android system image — so
there is no `.apk` to supply, nothing to upload and no credentials. The flow
stays on the timer setup screen: open the Timers tab, backspace the entry to
zero, key a duration on the keypad, read it back, and correct it with backspace.

They deliberately never **start** a timer. A running timer survives the session
and replaces the setup screen with its card, so a spec that starts one is
re-runnable only if it also finishes — an interrupted run would break every run
after it. Not starting one removes that class of failure, and the keypad still
exercises what an example is for: real input, real state change, captured.

They also avoid Clock's preset chips, which look like fixed controls and are
not: they are recently-used-duration suggestions, so a freshly reset Clock
offers only the keypad and a preset-based flow fails on any device without
timer history — including CI. Two Clock layouts exist on one app version, and
the keypad is common to both.

`DEVTOOLS_MODE=trace` switches any of them to trace mode, `DEVTOOLS_MOBILE=web`
drives the device's own browser instead of an app — Chrome on Android, Safari on
iOS — and `APPIUM_APP` points one at a real app. [`examples/MOBILE.md`](https://github.com/webdriverio/devtools/blob/main/examples/MOBILE.md)
in the repo is the full setup guide.

## iOS

```sh
DEVTOOLS_MOBILE_PLATFORM=ios pnpm demo:wdio:mobile
```

**All four adapters.** Each carries an `android/` and an `ios/` spec directory
and the runner picks between them, so the command above works with
`demo:selenium:mobile`, `demo:nightwatch:mobile` and `demo:python:mobile` too.
Capture itself was never platform-specific — what each adapter needed was a
spec, not adapter work.

iOS drives **Settings**, not Clock, because Clock is not installed on the
simulator at all: `xcrun simctl listapps` lists Settings, Calendar, Reminders,
Maps and Safari, and no Clock. Settings is on every simulator and every device,
which is the same property that makes Clock the Android choice. The flow
navigates into General and back, checking the navigation bar title each way —
the same shape as the Android flow, with the app the platform actually ships.

Android and iOS are **separate specs**, not one spec with a branch, because they
share no selectors: iOS locators are accessibility ids and labels rather than
resource-ids.

`DEVTOOLS_MOBILE=web` works here too, and needs less than it does on Android: it
opens **Safari**, which the XCUITest driver drives itself — no Chromedriver to
match and nothing to add to the `appium` command.

**Which simulator gets driven is resolved to a udid, never a bare name.** Naming
one that does not exist does not fail — the XCUITest driver *creates* it and
boots it, every run, beside the simulator already running, leaving a new
simulator behind each time. So the examples default to whichever simulator is
already booted, and an `IOS_DEVICE_NAME` matching none of them is refused with
the list of booted ones rather than passed through.

That is **local** policy. `xcrun simctl` enumerates local simulators and nothing
else, so `IOS_UDID` names a device outright and is checked against nothing — a
real device has no entry to match — and against a remote or cloud Appium
(`APPIUM_HOST` set to anything but localhost) a device name is passed straight
through, since naming one is how such a service selects it.

Beyond the Android prerequisites, none of which iOS uses, you need Xcode (the
Command Line Tools ship no simulators), a simulator runtime
(`xcodebuild -downloadPlatform iOS`, a separate ~8 GB download), a booted
simulator, and `appium driver install xcuitest` — whose first run also builds
WebDriverAgent. Appium loads drivers at **startup**, so a server that was
already running when you installed the driver will report that it cannot find
XCUITest until you restart it.

## Prerequisites

Running against a local Android emulator needs, beyond [Getting Started](/docs/devtools/getting-started):

1. **Java JDK** and the **Android SDK** — with `ANDROID_HOME` pointing at the SDK the `sdkmanager` on your `PATH` actually installs into, which is not always `~/Library/Android/sdk`.
2. **An AVD and a running emulator**, or a physical device with USB debugging.
3. **Appium with the UiAutomator2 driver** (`appium driver install uiautomator2`), or the XCUITest driver for iOS — see [iOS](#ios) above.
4. **A matching Chromedriver**, for a mobile browser or a hybrid app. A webview is driven by Chromedriver, and Appium's autodownload frequently has no build matching the Chrome on the system image — in either direction. It surfaces as `No Chromedriver found that can automate Chrome '<version>'` when entering a webview, which reads as a capture failure but is an environment gap. Start Appium with `--default-capabilities '{"appium:chromedriverExecutableDir": "<path>"}'` plus `--allow-insecure=uiautomator2:chromedriver_autodownload`. **A native-app run needs none of this.**
5. **Classic WebDriver protocol** for WebdriverIO — Appium's BiDi shim for UiAutomator2 does not implement every BiDi command, so set `'wdio:enforceWebDriverClassic': true` in the capability block.
