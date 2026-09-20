# @wdio/protocols

Hand-authored protocol command specs. The compiler turns them into TypeScript
command types under `src/commands/` — that directory is generated and gitignored.

## Edit here

- `src/protocols/*.ts` — WebDriver, Appium, Chromium, Sauce, Selenium, …
- `src/index.ts` — public exports

## Do not edit

- `src/commands/` — produced by `infra/compiler` type generation
- website protocol API pages — produced by `scripts/docs-generation/protocolDocs.ts`

## Adding a command

1. Add the spec (method, path, parameters, return type, description) to the
   owning protocol file.
2. `pnpm run compile:all` (or `pnpm run dev @wdio/protocols`).
3. Confirm generated types: `pnpm run test:typings:webdriver`.
4. If `webdriverio` wraps the command, add the wrapper + JSDoc + typings
   usage there too.

Register a brand-new protocol file in `scripts/protocols.ts`.

## Commands

```sh
pnpm run test:package wdio-protocols
pnpm run test:typings:webdriver
```
