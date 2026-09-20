# @wdio/compiler

Internal esbuild build plus protocol type generation. Not published to npm.

## What it owns

- ESM / CJS emit into `packages/*/build` and `packages/*/cjs`
- Generating `packages/wdio-protocols/src/commands` from protocol specs
- Watch mode used by `pnpm run dev`

Root scripts:

```sh
pnpm run compile                     # compiler package itself
pnpm run compile:all:core            # logger, types, globals, protocols, repl
pnpm run compile:all:main            # utils, reporter, config, xvfb, webdriver, webdriverio
pnpm run compile:all                 # every package (core → main → rest)
pnpm run dev [package]
```

`pnpm run setup` is `clean` + `generate` + `compile:all`. Need that after a
fresh clone or after deleting `packages/*/build`.

## Guardrails

- Type generation lives in `src/type-generation/`. Changes there affect every
  protocol command type — run `pnpm run test:typings` and a protocols unit
  test.
- Do not check in `packages/*/build`. CI compiles from source.
- Package consumers import compiled output. If tests fail with
  `Cannot find module '.../build/...'`, compile first; it is not a source bug.
- The published CLI name in this folder's README still says `@wdio/build` in
  places; the workspace package is `@wdio/compiler`. Use the root `pnpm run`
  scripts above.
