# @wdio/cli

Testrunner CLI, launcher, and config scaffolding. Worker execution belongs in
`@wdio/local-runner` / `@wdio/runner`.

## Layout

- `src/commands/` — `wdio run`, `wdio config`, `wdio repl`, …
- `src/launcher.ts` — process orchestration
- `src/templates/` — EJS templates for `wdio config` (linted by `test:ejslint`)

## Commands

```sh
pnpm run dev @wdio/cli
pnpm run test:package wdio-cli
pnpm run test:ejslint
pnpm run test:smoke mochaTestrunner
```

Launcher / retry / spec-filter changes usually need a named smoke suite
(`cliSpecsWithWildCard`, `retryFail`, `runSpecsWithFlagNoArg`, …). See
[tests/AGENTS.md](../../tests/AGENTS.md).

## Guardrails

- Keep CLI flags in sync with docs (`website/docs`) and `create-wdio`.
- Config examples are duplicated across `examples/`, `tests/helpers/`, and
  docs. Search the string before renaming a key.
- Do not start a real browser from unit tests; smoke uses the mock service.
