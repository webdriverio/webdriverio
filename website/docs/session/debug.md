---
id: debug
title: Debug a test with a session
description: Pause a failing WebdriverIO run and inspect it with wdio session, then resume or close it.
---

`wdio run --debug=agent` pauses the worker on `await browser.debug()` and after a failed test, and raises the framework timeout to 24 hours. The pause covers both Mocha tests and Cucumber steps. The run prints the session name (`debug-0-0` for the first worker):

```sh
npx wdio run wdio.conf.ts --debug=agent
npx wdio session -s debug-0-0 snapshot
npx wdio session -s debug-0-0 exec -e "await browser.getTitle()"
npx wdio session -s debug-0-0 resume
```

`close` on that session fails the paused test with `Session closed from wdio session`. Resume when the test should continue. Close when you want the run to fail at the pause.

`browser.debug()` without `--debug=agent` still opens the [REPL](/docs/repl) inside the test. `--debug=agent` is the path that lets another process, including a coding agent, drive the paused worker with `wdio session`.

## Attach a REPL

`wdio repl --session <name>` attaches to a session that is already open and leaves it running when you exit:

```sh
npx wdio session open chrome https://webdriver.io
npx wdio repl --session default
```

Each REPL line runs as `wdio session exec`. `.exit` prints `Detached from "default" (still running)`.

## Doctor

`npx wdio session doctor` checks Node.js, the browser, Appium, SDKs and cloud credentials before you open a session. `doctor <target>` checks only what that target needs. The process exits 1 when a check fails. A session that is still starting is left in place. A session whose process is gone is removed.

## Troubleshooting

| Message | What to do |
| --- | --- |
| `Session closed from wdio session` | You closed the debug session. Use `resume` when the test should continue. |
| No `debug-0-0` session | The run has not paused yet, or it used a different worker id. `wdio session list` prints the names. |
| The pause never happens | The command must be `wdio run --debug=agent`. A passing test does not pause unless it calls `browser.debug()`. |

## Next steps

- [Debugging](/docs/debugging) — `browser.debug()`, breakpoints and flaky tests
- [REPL](/docs/repl) — the interactive shell
- [wdio session](/docs/session) — open a session that is not attached to a test run
