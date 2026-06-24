---
title: "This WebDriver Went Tracing"
authors: winify
---

We've all been there. A test fails in CI. You open the logs, and all you get is:

```
Error: expected 'tomsmith' to be 'tomsmih'
```

No screenshot (maybe one at the end). No timeline. No idea what the browser was doing when it happened. Just a lonely assertion error and the slow realization that you'll be running this locally six times to reproduce it.

That's why we added trace mode to `@wdio/devtools-service`. It's like a black box recorder for your tests, with every navigation, click, keystroke, network request, console log, and DOM snapshot, written to disk so you can replay the whole run after the fact.

<!-- truncate -->

## What It Produces

Enable trace mode and you get a single artifact as a trace zip (or directory) containing:

- **`trace.trace`** — an NDJSON timeline of every user-visible action. Navigations, clicks, fills, hovers, taps, swipes, keyboard presses, and other user-facing commands. Each action is a `before`/`after` pair with timestamps, selectors, and parameters.
- **`trace.network`** — every HTTP request and response in HAR format, so you can see what the browser fetched and when. (Browser sessions only — Appium mobile sessions skip network capture.)
- **`resources/`** — screenshots, element snapshots, and accessibility trees captured at each action boundary. On mobile, element snapshots come from the native XML tree instead of the DOM. You can actually *see* what the screen looked like before and after every step.
- **`transcript.md`** — a human-readable Markdown log of the run. Paste it into a chat window, pipe it to an LLM, or just read it yourself.

And if you structure your tests with `it()` blocks (Mocha) or `Scenario` (Cucumber), each test becomes a named group wrapping its actions, so the timeline shows you exactly which test did what. Appium mobile sessions are also supported; native taps, swipes, and element interactions all appear as trace actions.

## Quick Start

`@wdio/devtools-service` is ready for WebdriverIO v9+. Install it, then drop this in your config:

```js
export const config = {
    // ... your existing config ...
    capabilities: [{
        browserName: 'chrome'
    }],
    outputDir: './logs',
    services: [['devtools', {
        mode: 'trace',                        // skip the DevTools UI, write to disk
        traceFormat: 'zip',                   // or 'ndjson-directory'
        traceGranularity: 'spec'              // one trace per spec file
    }]]
}
```

Run your tests. You'll find a `trace-<sessionId>.zip` (or `trace-<sessionId>/` directory) in your `outputDir`.

To view it, drop the zip into [player.vibium.dev](https://player.vibium.dev), and it reads the same format and renders the full timeline with screenshots, network waterfall, and console output.

## Why This Format

The trace format follows the [Vibium recording format](https://github.com/VibiumDev/vibium/blob/main/docs/explanation/recording-format.md) as a Playwright-compatible (no shame, no shade) NDJSON schema that the ecosystem already knows how to render. We didn't invent a new format. We adopted one that has a viewer, a spec, and a path toward self-healing tests (more on that another day).

The format first shipped in [`@wdio/mcp`](/docs/mcp) earlier this year, for the MCP server to record every AI-driven session as a trace, that you can replay at `player.vibium.dev`. Trace mode brings the same capability to your regular test runs, no AI assistant required.

## Per-Spec vs Session

By default, you get one trace per worker session. If your worker runs three spec files, they all land in one trace.

Set `traceGranularity: 'spec'` and you get one trace *per spec file*. Each trace is smaller, faster to load in the viewer, and named after the spec that produced it. Useful when you're debugging one particular file and don't want to sift through the other two.

## What It Captures (And What It Doesn't)

Trace mode records **user-visible actions**: navigate, click, fill, select, hover, scroll, key press. Internal commands like `findElement`, `waitUntil`, and `executeScript` are excluded — they aren't user-facing intent. Read-only commands (`getText`, `getValue`, `isDisplayed`, `getCSSProperty`, etc.) also don't appear in the action timeline. The goal is reproducibility, not exhaustive logging.

The network log captures everything the browser fetches. Console logs come from both the browser's `console.*` and the test process' `stdout`/`stderr`. DOM mutations are tracked, and screenshots are taken at action boundaries so you can visually step through the run.

## What's Next

Two things we're excited about:

1. **Self-healing traces** — the recording format supports re-recording against a modified page. A trace captured today should be replayable against tomorrow's build, with the player diffing DOM snapshots to spot regressions.
2. **CI-first workflows** — upload the trace zip as a build artifact, link to it from your test report. One click from a failed assertion to the exact moment it happened.

## Learn More

- [DevTools Service docs](/docs/wdio-devtools-service) — full configuration reference
- [Vibium recording format](https://github.com/VibiumDev/vibium/blob/main/docs/explanation/recording-format.md) — the trace format spec
- [`@wdio/mcp`](/docs/mcp) — AI-driven session recording with the same trace format

Got a trace you want to share? Drop it on [player.vibium.dev](https://player.vibium.dev). Questions or feedback? Find us on [Discord](https://discord.webdriver.io).

Happy tracing.
