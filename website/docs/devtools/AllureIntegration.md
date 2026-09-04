---
id: allure
title: Allure Integration
---

Trace-mode artifacts — the trace zip and each test's per-test screenshot and video — attach to an Allure report automatically, so you can open them straight from the report. See [Trace Mode](/docs/devtools/wdio/trace-mode) for how to enable trace mode and produce these artifacts.

When an Allure reporter is present, trace-mode artifacts attach to the Allure report automatically — no extra wiring:

- **`traceGranularity: 'test'`** — each test's `trace.zip` (`application/zip`, a download that opens in `show-trace`), `screenshot` (`image/png`, inline) and `video` (`video/webm`, inline) attach to that test's card. This is the granularity to use for a per-test Allure report.
- **`traceGranularity: 'session'` / `'spec'`** — a session/spec-spanning trace is written to disk and enumerated in the [artifacts manifest](/docs/devtools/wdio/trace-mode#artifacts-manifest--emitartifactsmanifest), but **not** attached to individual test cards: a session/spec trace is only finalized after all its tests have run, by which point their Allure cards are closed and there is no open test to attach to. To surface it anyway, post-process the manifest in your own `onComplete` hook.

Per-adapter support:

| Adapter | Attach mechanism |
|---|---|
| **WebdriverIO** | First-class via `@wdio/allure-reporter`'s `addAttachment`. |
| **Selenium** | Via `allure-js-commons`' `attachment()` — runtime-agnostic, attaches under any Allure runner adapter, gated on an active `allure-js-commons` runtime. |
| **Nightwatch** | **Produce-only** — files + manifest are written but not attached inline (no live Allure attach API). |

**Embedded trace viewer.** Because the archive uses a portable, standard trace-viewer on-disk format, an Allure report's own **embedded trace viewer** (Allure ≥ 2.35) can open the attached `trace.zip` directly inside the report.

**Report noise.** In trace mode the capture takes a per-action `takeScreenshot` to build the timeline; Allure logs every WebDriver command as a step and a screenshot per `takeScreenshot`. Silence that flood with the reporter's own options — the trace / screenshot / video attachments are unaffected:

```ts
reporters: [
  ['allure', {
    outputDir: 'allure-results',
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: true
  }]
]
```
