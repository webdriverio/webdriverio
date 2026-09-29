# @wdio/sauce-service

Package-specific notes. Shared package rules live in [../AGENTS.md](../AGENTS.md).

## Tests

Owners:

- Sauce Connect launch, tunnel name, and retries: `tests/launcher.test.ts` against `src/launcher.ts`.
- Worker hooks, job updates, and annotations: `tests/service.test.ts` against `src/service.ts`.
- Real device versus emulator or simulator: `isRDC` in `src/utils.ts`, covered by `tests/utils.test.ts`.

Classify sessions with `isRDC` only. Tunnel setup stopped consulting a separate emulator helper when Sauce Connect moved to W3C options.

`onPrepare` leaves `hostname`, `port`, and `protocol` alone. Sauce Connect 5 removed the Selenium relay (`scRelay`).

Keep a single `getBody` test for job body shape. Name each test after the hook it calls.
