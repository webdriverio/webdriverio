# webdriverio

User-facing automation API (`browser`, `$`, `$$`, element commands, mocks).
Protocol transport belongs in `webdriver`. Shared types belong in `@wdio/types`.

## Layout

- `src/commands/browser/` — `browser.*` commands
- `src/commands/element/` — element commands
- `src/commands/mobile/` — mobile / Appium helpers
- `src/scripts/` — snippets injected into the browser
- `src/utils/` — command support (not a second public API)

Each new command needs:

1. Implementation with JSDoc (feeds `pnpm run docs:generate`)
2. A sibling unit test under `tests/commands/...`
3. A usage snippet in `tests/typings/webdriverio/async.ts` if the public type
   surface changed

## Commands

```sh
pnpm run dev webdriverio
pnpm run test:package webdriverio
npx vitest packages/webdriverio/tests/commands/element/getCSSProperty.test.ts
pnpm run test:typings:webdriverio
```

Use `@wdio/webdriver-mock-service` scenarios for runner-level command checks
(`pnpm run test:smoke standaloneTest`). Do not launch a real browser in unit
tests.

## Guardrails

- Add user-facing behavior here, not in `webdriver`, unless it is a raw
  protocol call.
- Keep commands small; put reusable logic in `src/utils/` of this package.
- JSDoc parameter / return types must match the implementation. Docs are
  generated from these comments, not rewritten by hand in `website/docs/api`.
- Multi-remote and browser-runner both consume this package. Prefer
  `browser` / `multiremotebrowser` helpers over assuming a single session.
