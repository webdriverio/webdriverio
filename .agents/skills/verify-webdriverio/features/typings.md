# Typings

A user imports `webdriverio` or `webdriver` from TypeScript and calls a command. Typings prove the public signatures typecheck. They do not prove runtime behavior.

## Sub-features

- `typings-webdriverio` typechecks browser, element, and config usage.
- `typings-webdriver` typechecks the raw client.
- `typings-mocha` typechecks Mocha testrunner types.
- `typings-jasmine` typechecks Jasmine testrunner types.
- `typings-cucumber` typechecks Cucumber testrunner types.

## How to get to it (user POV)

- All of them: `pnpm run test:typings`
- One surface: `pnpm run test:typings:webdriverio`, `test:typings:webdriver`, `test:typings:mocha`, `test:typings:jasmine`, `test:typings:cucumber`
- Usage samples live in `tests/typings/<surface>/`. WebdriverIO commands are exercised from `tests/typings/webdriverio/async.ts` and `tests/typings/webdriverio/commands.ts`.

## Driving it with the WebdriverIO harness

Preconditions:

- `.agents/resume` prints `Ready.`
- The package you changed has been compiled so `tsc` sees fresh `build/` types.

- **WebdriverIO surface.** Run `pnpm run test:typings:webdriverio`. Exit 0 and `tsc` prints no error.
- **Webdriver client.** Run `pnpm run test:typings:webdriver`. Exit 0.
- **Framework config.** Run the one `test:typings:mocha`, `test:typings:jasmine`, or `test:typings:cucumber` script that matches the framework you changed. Exit 0.
- **Extend the check.** Add a usage snippet that calls the new or fixed signature in the matching file under `tests/typings/`. Re-run that script. Exit 0. If the snippet is wrong, `tsc` exits non-zero and names the file and line.
- **Proof.** Save stdout to `.agents/verify-artifacts/typings/output.txt`. `result.txt` records the script name and exit code.

## Gotchas

- `pnpm run test:typings` runs `pnpm install` first, then every surface in parallel. Prefer the single `test:typings:*` script for the surface you changed.
- A green `tsc` run does not prove the command works at runtime. Pair it with smoke or an example when the change also affects behavior.
- Do not hand-edit generated files in `packages/*/build`. Compile, then typecheck.
