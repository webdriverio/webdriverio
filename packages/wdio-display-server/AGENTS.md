# @wdio/display-server

Package-local notes for agents. Repo-wide rules are in the root
[AGENTS.md](../../AGENTS.md) and [packages/AGENTS.md](../AGENTS.md).

## Tests

- `startDisplayDaemonFromConfig` publishes daemon env in `tests/daemon.test.ts`.
  Do not add a parameter so a test can pass a fake manager. Mock
  `DisplayServerManager` in that file. The fork fixture
  `tests/fixtures/env-echo.mjs` is the child-inheritance check.
- Distro install commands are the backend suites' contract. Shell logic that
  mocks cannot prove, such as the dnf Weston fallback, runs through `install()`
  with stubs on `PATH`. Do not export the command table for a test to spawn.
- `waitForSocket` polling, abort, and timeout live in `tests/utils.test.ts`.
  Backend tests assert the socket path or display fd they wait on. Real-process
  tests own the spawned child, the stderr tail, and teardown.
