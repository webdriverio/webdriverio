# @wdio/snapshot

Page and native snapshot trees: collecting, formatting, diffing, refs. It has
two consumers and the public API (`src/index.ts`) is what they need:

- `@wdio/session` for `wdio session snapshot` and the actions that resolve refs.
- devtools `@wdio/elements`, which uses the web collector (`collectWeb`,
  `collectScript`), `attachSelectors`, `inViewport`, `onlyInteractive`,
  `parseNativeSource` and `formatSnapshot`.

Do not export a symbol that neither needs. CLI behaviour (`find`, the page
recorder, the `wdio session frame` hint) belongs in `@wdio/session`.

The package does not know sessions, but it owns the page store
`window.__wdioSession` that persistent refs live in (the name is kept for
compatibility). `assignRefs: 'ephemeral'` never touches it.

## Commands

```sh
pnpm run test:package wdio-snapshot
pnpm run test:unit:browser
pnpm run test:e2e:session
```

## Guardrails

- `collectInPage` is serialized into the page with `toString()`. It must stay a
  self-contained browser function: no imports, module-level helpers, or
  closures over outer identifiers.
- The page-side names `window.__wdioSession` and `Symbol.for('wdio.page')` must
  not change. Pages, init scripts (the recorder in `@wdio/session`) and
  `refFunction` rely on them.
- Errors are `SnapshotError`; `@wdio/session` maps them to its own errors.
