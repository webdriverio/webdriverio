---
id: limitations
title: Trace Mode Limitations
description: "Review what DevTools trace mode deliberately does not capture and the known limitations across the WebdriverIO, Selenium and Nightwatch adapters."
---

What [Trace Mode](/docs/devtools/wdio/trace-mode) deliberately skips, plus the known gaps across adapters.

## What trace mode skips

- **DevTools UI window** — no Chrome instance opens for the dashboard.
- **Backend port-bind**: the JavaScript adapters reserve no localhost port. The Python adapter still starts (or attaches to) the backend, because the backend builds its archive, but opens no window.
- **`screencast.enabled`** — the live-mode continuous `.webm` recording is ignored in trace mode (a warning is logged). Trace mode instead records a dense [`filmstrip`](/docs/devtools/wdio/trace-mode#dense-filmstrip--filmstrip) into the archive **by default** (set `filmstrip: false` for one frame per action), plus per-test [`video`](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) slices when enabled. The screencast **tuning** fields (`quality`, `maxWidth`, `pollIntervalMs`, …) still apply to whichever recorder runs.
- **`wdio-trace-<sessionId>.json` dump** — removed entirely. The legacy monolithic JSON the WDIO live mode used to write is gone; live mode now streams to the dashboard and writes nothing to disk, and the `trace.zip` is the single trace artifact.

## Known limitations

- **Nightwatch BDD `describe/it`** — `traceGranularity: 'test'` collapses to a **single session-scoped slice**: Nightwatch runs the individual `it`s internally without a per-test hook the plugin can see, so the slice keys to the first test. Metadata capture (per-testcase state in the manifest) is unaffected, but per-`it` trace/screenshot/video keying and retry-aware retention degrade to session scope for this interface. Nightwatch's **exports-object** and **Cucumber** interfaces expose per-scenario/per-test hooks and get real per-test slicing. (WebdriverIO mocha/cucumber and Selenium mocha are unaffected.)
- **Nightwatch retry-aware retention** — only `retain-on-failure` works; other retry-aware policies degrade because Nightwatch re-runs a testcase internally on `--retries` without re-firing the per-test hooks. See [Retention](/docs/devtools/wdio/trace-mode#retention--tracepolicy).
- **Nightwatch Allure attach** — per-test `screenshot`/`video` are produce-only (files + manifest), not attached inline; see [Allure integration](/docs/devtools/allure).
- **WebdriverIO needs WebDriver BiDi** for page capture (Chrome 114+, Firefox 130+; enabled automatically). Appium sessions skip it; set `'wdio:enforceWebDriverClassic': true` there.
- **Safari in live mode must stay the frontmost window**: Safari delivers synthesized clicks and keys only to its frontmost window and reports success either way, so input issued while the dashboard or any other window is in front reaches nothing. The Selenium (Node.js) adapter opens its dashboard behind Safari and brings the session's window forward before each input; the WebdriverIO service, Nightwatch and Python bring Safari to the front once after the session starts (macOS, local Safari only). Do not click into other windows, including the dashboard, while a live Safari run is in progress. Trace mode opens no window and is not affected.
- **Network without BiDi**: on Safari and Appium sessions the Network tab comes from the page's own `fetch` / `XMLHttpRequest` patch and Resource Timing buffer, so loads the page did not make through `fetch` / XHR carry no headers or body, and on Safari no status. A native app session captures network only through the appium-interceptor plugin (`appium:intercept: true`, Android); see [Native app network](/docs/devtools/mobile#native-app-network). See [Network Logs](/docs/devtools/wdio/network-logs#without-webdriver-bidi).
- **Hybrid apps**: only WebdriverIO follows a hybrid app into its webview, and a hybrid app's webview actions carry no per-action element data, A11y tree or settle screenshot. See [Mobile Testing](/docs/devtools/mobile).
- **No redaction**: a trace records everything the run displayed or typed: DOM mutations, `fill` arguments, the transcript and the test source. Only password-field values are blanked in the element snapshot, and typed text still appears in the mutation stream. Treat a trace archive as being as sensitive as the run that produced it.
- **Non-Chrome video/filmstrip** — on browsers without a CDP push path the recorder polls `takeScreenshot`, which adds WebDriver round-trips and (under Allure) floods the step log; pair with the reporter's step-silencing options.
