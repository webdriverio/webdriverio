---
id: cross-framework
title: Cross-Framework Support
---

The trace format and the `show-trace` player are identical across WebdriverIO / Selenium / Nightwatch; this page shows where capture completeness differs. For the full trace-mode reference, see [Trace Mode](/docs/devtools/wdio/trace-mode).

The transforms that build a trace live in [`@wdio/devtools-trace`](https://github.com/webdriverio/devtools/tree/main/packages/trace), one layer below the adapters, so the **trace format and the `show-trace` player are identical for every adapter** — the same `.zip` (or directory) opens in the same player regardless of which produced it. The three adapters below additionally share the core options (`mode`, `traceGranularity`, `tracePolicy`, `traceFormat`, `filmstrip`, `emitArtifactsManifest`, `captureAssertions`).

**Capture completeness varies by adapter**, though — WebdriverIO is the most complete; Selenium and Nightwatch cover the core flow with the gaps noted below. Framework-specific enable syntax lives on each adapter page — see [Selenium](/docs/devtools/selenium#trace-mode) and [Nightwatch](/docs/devtools/nightwatch#trace-mode).

The Python adapter (see the **Python** tabs on the [Selenium](/docs/devtools/selenium) page) writes the same archive and opens in the same player, but is not in this table: it runs no JavaScript in the test process, so the backend builds its trace from the captured stream instead of the adapter building it in-process. Granularity and retention do have Python equivalents — `--devtools-trace-granularity session|test` and `--devtools-trace-policy`, the latter with its retry-aware values degrading to `retain-on-failure` because nothing on that wire carries an attempt number. The rows with no Python equivalent are the per-test-artifact ones: `screenshot`, `video` and inline Allure attach. What it does capture - DOM time-travel, the dense filmstrip, the A11y tree and element overlay, commands, console, network, assertions, run controls and Preserve & Rerun - is on its own page.

| Capability | WebdriverIO | Selenium | Nightwatch |
|---|---|---|---|
| Trace mode + `show-trace` player | ✅ | ✅ | ✅ |
| DOM time-travel (mutation capture) | ✅ | ✅ ¹ | ✅ |
| A11y tab + pick-locator overlay (trace player) | ✅ | ✅ | ✅ |
| Transcript + Copy-for-LLM | ✅ | ✅ | ✅ |
| Per-test `screenshot` / `video` | ✅ inline Allure | ✅ inline Allure | ⚠️ produce-only ² |
| `emitArtifactsManifest` auto-detect | ✅ | ✅ | ⚠️ opt-in only |
| Retry-aware `tracePolicy` | ✅ | ✅ | ⚠️ `retain-on-failure` only ³ |
| `traceGranularity: 'test'` | ✅ | ✅ | ⚠️ Cucumber / exports-object; BDD `describe/it` collapses to a session slice |
| Cucumber Feature→Scenario→Step nesting | Scenario→Step ⁴ | ✅ full | Feature→Scenario ⁵ |
| BiDi capture (console / network / exceptions) | ✅ auto | ✅ auto | ⚠️ opt-in (`bidi: true` + `webSocketUrl`) |
| Screencast (filmstrip / video) | CDP push | CDP push | polling only |
| Live-dashboard A11y tab + overlay | ✅ | trace player only | trace player only |

¹ Selenium reconstructs the DOM per navigation; anchor timing is approximate (a navigation's snapshot can lag the command that triggered it).
² Nightwatch has no live Allure attach API, so per-test artifacts are written to the trace output dir and listed in the manifest, but not attached to an Allure test.
³ Nightwatch's `--retries` re-runs a test internally without re-firing the plugin's per-test hooks, so the retry-aware policies (`on-first-retry`, `retain-on-first-failure`, …) degrade to `retain-on-failure`.
⁴ WebdriverIO does not yet carry feature-level ancestry, so its Cucumber nesting is Scenario→Step.
⁵ Nightwatch does not yet stamp per-step nesting (Feature→Scenario only).
