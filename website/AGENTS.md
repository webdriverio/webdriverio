# website/

Docusaurus 3 docs site, hosted on Vercel. Many pages are generated. Hand-write guidelines
here; regenerate API and package pages from source.

Before writing or restructuring a page, read [`STYLEGUIDE.md`](./STYLEGUIDE.md):
pages are written for coding agents first (frontmatter `description`,
complete examples, no content hidden in UI components).

## Hand-written vs generated

| Edit this | To change |
|-----------|-----------|
| `website/docs/*.md` (and topic folders) | Guides, flowcharts, migration pages. Type pipeline: `flowcharts/TypeGeneration.md` |
| `packages/<reporter-or-service>/README.md` | That plugin's docs page |
| JSDoc on `webdriverio` commands | `website/docs/api` command pages |
| `@wdio/protocols` specs | Protocol API pages |
| `scripts/docs-generation/3rd-party/` | Community plugin docs |

Generated / gitignored: `website/docs/api/**` (except a few hand-written
files listed in `.gitignore`), `website/docs/_*.md`, `website/sidebars.json`,
`website/docs/Contribute.md`.

## Commands

```sh
pnpm run docs:list
pnpm run docs:generate:en    # English only; skips the i18n zip download
pnpm run docs:generate       # includes translation download (CI / full site)
pnpm run watch:docs          # English-only regenerate + docusaurus start
cd website && pnpm install && pnpm start
cd website && pnpm start:i18n
pnpm run docs:build          # production build (CI docs job)
pnpm run docs:check          # sidebar coverage, URL preservation, llms.txt links
pnpm run docs:eval           # can the docs search find the right page? (website/evals)
```

`pnpm start` in `website/` regenerates English docs, then starts the dev server.
It does not download translations. Use `pnpm start:i18n` (or `pnpm run docs:generate`
from the repo root) when a local preview needs the other locales. JSDoc,
protocol, and README edits are picked up on the next start.

## Guardrails

- Frontmatter `id` / `title` must stay stable; they are permalinks.
- Translations are pulled from `webdriverio/i18n` during generate. Do not
  hand-edit `website/i18n/*` except `website/i18n/en`.
- Config keys appear in many examples. Grep the repo, not just `website/`.
- Hosting is Vercel. `website/vercel.json` owns redirects, headers and
  Markdown content negotiation; add a redirect there whenever a page URL
  changes. Production deploys go through the `Docs Deploy` workflow only.
