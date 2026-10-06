# @wdio/snapshot

Page and native snapshot trees: collecting, formatting, diffing, refs, `find`
helpers. `@wdio/session` consumes it; it knows nothing about sessions.

## Commands

```sh
pnpm run test:package wdio-snapshot
pnpm run test:unit:browser
pnpm run test:e2e:session
```

## Guardrails

- `collectInPage` and `pageRecorder` are serialized into the page with
  `toString()`. They must stay self-contained browser functions: no imports,
  module-level helpers, or closures over outer identifiers.
- The page-side names `window.__wdioSession` and `Symbol.for('wdio.page')` must
  not change. Pages, init scripts and `refFunction` rely on them.
- Errors are `SnapshotError`; `@wdio/session` maps them to its own errors.
