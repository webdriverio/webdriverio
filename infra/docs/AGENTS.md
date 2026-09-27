# @wdio/docs

Generate the WebdriverIO documentation website. This package is not published.

Prefer the root `pnpm run` entry points over calling these files with raw `tsx`.

| Task | Command |
|------|---------|
| API / protocol / package docs | `pnpm run docs:generate` |
| English only (skip i18n download) | `pnpm run docs:generate:en` |
| Sidebar coverage, redirects, `llms.txt` | `pnpm run docs:check` |
| Docs search eval | `pnpm run docs:eval` |
| BiDi types | `pnpm run generate:bidi` (`@wdio/bidi-codegen`) |
| Protocol aggregator | `infra/utils/src/protocols.ts` |

## Layout

- `src/generateDocs.ts` orchestrates page generation.
- `src/protocolDocs.ts`, `src/wdioDocs.ts`, and `src/packagesDocs.ts` write API and package pages.
- `src/3rd-party/` is the source list for community plugin docs.
- `src/checkDocs.ts` and `src/evalDocs.ts` are the CI checks behind `docs:check` and `docs:eval`.

## Guardrails

- Docs generation mutates `website/sidebars.json` and writes `_*.md` API pages. Those outputs are gitignored; do not commit them.
- `docs:generate` needs `GITHUB_AUTH` so translations can be downloaded from `webdriverio/i18n`. `docs:generate:en` skips that download.
- Release, changelog, and tag scripts live in `@wdio/release`. Do not run `pushReleaseTag` or a production docs deploy without explicit TSC approval.
