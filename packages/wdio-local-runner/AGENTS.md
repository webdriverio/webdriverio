# @wdio/local-runner

Forks one worker process per capability and owns its lifetime: ready/session
IPC, shutdown, the display daemon, and the in-worker REPL queue.

## Commands

```sh
pnpm run dev @wdio/local-runner
pnpm run test:package wdio-local-runner
```

Display-daemon changes also need `pnpm run test:e2e:display-server` on a Linux
host with no display. Elsewhere, leave that lane to CI.

## Test ownership

- `LocalRunner` fork, shutdown, watch-mode attach, and display lifetime:
  `tests/localRunner.test.ts`. Force-kill after the real `SHUTDOWN_TIMEOUT`:
  `tests/workerCleanupIssue.test.ts`.
- Worker IPC, exit codes, and `kill`: `tests/worker.test.ts`. Forked log-file
  names: `tests/worker.env.test.ts`.
- Child-process entry (`src/run.ts`): `tests/run.test.ts`.
- REPL eval and result callbacks: `tests/repl.test.ts`. One-at-a-time debug
  sessions: `tests/replQueue.test.ts` through `ReplQueue.next`.
- Log prefix and debugger-line filtering: `tests/transformStream.test.ts`.
  Write the Node debugger prefixes in the test. Do not feed it
  `DEBUGGER_MESSAGES`.

Do not add a second assertion of the same exit payload. Assert REPL errors
through `onResult`, not private helpers. A skipped queue test is not coverage.
