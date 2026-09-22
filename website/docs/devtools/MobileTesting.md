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

The discriminator is the **browser the capabilities name**, not the device: a mobile browser states one, a native app states none. A device is not required either — a Mac2, WinAppDriver or tvOS session has no document and is treated the same way.

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
there is no `.apk` to supply, nothing to upload and no credentials. The flow is
deliberately deterministic: open the Timers tab, clear any timer a previous run
left behind, start the 5-minute preset, pause it, and delete it. Clearing first
is what makes them re-runnable, because a timer survives the session and while
one exists the Timers tab shows its card instead of the presets.

`DEVTOOLS_MODE=trace` switches any of them to trace mode, `DEVTOOLS_MOBILE=web`
drives Chrome on the same device instead of an app, and `APPIUM_APP` points one
at a real app. [`examples/MOBILE.md`](https://github.com/webdriverio/devtools/blob/main/examples/MOBILE.md)
in the repo is the full setup guide.

## Prerequisites

Running against a local Android emulator needs, beyond [Getting Started](/docs/devtools/getting-started):

1. **Java JDK** and the **Android SDK** — with `ANDROID_HOME` pointing at the SDK the `sdkmanager` on your `PATH` actually installs into, which is not always `~/Library/Android/sdk`.
2. **An AVD and a running emulator**, or a physical device with USB debugging.
3. **Appium with the UiAutomator2 driver** (`appium driver install uiautomator2`), or XCUITest for iOS.
4. **A matching Chromedriver**, for a mobile browser or a hybrid app. A webview is driven by Chromedriver, and Appium's autodownload frequently has no build matching the Chrome on the system image — in either direction. It surfaces as `No Chromedriver found that can automate Chrome '<version>'` when entering a webview, which reads as a capture failure but is an environment gap. Start Appium with `--default-capabilities '{"appium:chromedriverExecutableDir": "<path>"}'` plus `--allow-insecure=uiautomator2:chromedriver_autodownload`. **A native-app run needs none of this.**
5. **Classic WebDriver protocol** for WebdriverIO — Appium's BiDi shim for UiAutomator2 does not implement every BiDi command, so set `'wdio:enforceWebDriverClassic': true` in the capability block.
