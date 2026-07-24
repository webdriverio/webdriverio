---
id: limitations
title: Trace Mode Limitations
---

What [Trace Mode](/docs/devtools/wdio/trace-mode) deliberately skips, plus the known gaps across adapters.

## What trace mode skips

- **DevTools UI window** — no Chrome instance opens for the dashboard.
- **Backend port-bind** — no localhost port is reserved (parity across all three adapters as of v1.2+).
- **`screencast.enabled`** — the live-mode continuous `.webm` recording is ignored in trace mode (a warning is logged). Trace mode instead records a dense [`filmstrip`](/docs/devtools/wdio/trace-mode#dense-filmstrip--filmstrip) into the archive **by default** (set `filmstrip: false` for one frame per action), plus per-test [`video`](/docs/devtools/wdio/trace-mode#per-test-screenshot--video--screenshot--video) slices when enabled. The screencast **tuning** fields (`quality`, `maxWidth`, `pollIntervalMs`, …) still apply to whichever recorder runs.
- **`wdio-trace-<sessionId>.json` dump** — removed entirely. The legacy monolithic JSON the WDIO live mode used to write is gone; live mode now streams to the dashboard and writes nothing to disk, and the `trace.zip` is the single trace artifact.

## Known limitations

- **Nightwatch BDD `describe/it`** — `traceGranularity: 'test'` collapses to a **single session-scoped slice**: Nightwatch runs the individual `it`s internally without a per-test hook the plugin can see, so the slice keys to the first test. Metadata capture (per-testcase state in the manifest) is unaffected, but per-`it` trace/screenshot/video keying and retry-aware retention degrade to session scope for this interface. Nightwatch's **exports-object** and **Cucumber** interfaces expose per-scenario/per-test hooks and get real per-test slicing. (WebdriverIO mocha/cucumber and Selenium mocha are unaffected.)
- **Nightwatch retry-aware retention** — only `retain-on-failure` works; other retry-aware policies degrade because Nightwatch re-runs a testcase internally on `--retries` without re-firing the per-test hooks. See [Retention](/docs/devtools/wdio/trace-mode#retention--tracepolicy).
- **Nightwatch Allure attach** — per-test `screenshot`/`video` are produce-only (files + manifest), not attached inline; see [Allure integration](/docs/devtools/allure).
- **Non-Chrome video/filmstrip** — on browsers without a CDP push path the recorder polls `takeScreenshot`, which adds WebDriver round-trips and (under Allure) floods the step log; pair with the reporter's step-silencing options.
