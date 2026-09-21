# webdriver

Low-level WebDriver, WebDriver BiDi, and Appium client. No `$` / element
sugar — that lives in `webdriverio`.

## Layout

- `src/` — session factory, request pipeline, command wrapper
- `src/bidi/` — BiDi types and helpers; many files are generated
- `src/cjs/` — CJS interop entry

Protocol *definitions* live in `@wdio/protocols`. This package *implements*
the HTTP / BiDi calls those specs describe.

## Generated BiDi

```sh
pnpm run generate:bidi
```

Do not hand-edit generated files under `src/bidi/`. Change the CDDL pipeline
in `scripts/bidi/` and regenerate. `pnpm run generate:bidi` also oxlint-fixes
the output.

## Commands

```sh
pnpm run dev webdriver
pnpm run test:package webdriver
pnpm run test:typings:webdriver
```

New protocol methods: add the spec in `packages/wdio-protocols/src/protocols/`
first, compile, then wire the client here if a custom implementation is
required. Most commands are generated from the spec and need no hand-written
client method.

## Guardrails

- Do not import `webdriverio` from this package (layering).
- Session / request middleware changes affect every command. Cover them with
  unit tests around the request pipeline, not one test per command.
- Interop: CJS consumers are checked by `pnpm run test:interop`.
