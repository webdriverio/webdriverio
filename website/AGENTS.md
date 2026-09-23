# website/

Docusaurus 3 docs site, hosted on Vercel. Many pages are generated. Hand-write guidelines
here; regenerate API and package pages from source.

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
pnpm run docs:generate
pnpm run watch:docs          # regenerate + docusaurus start
cd website && pnpm install && pnpm start
pnpm run docs:build          # production build (CI docs job)
```

`pnpm start` in `website/` does not pick up JSDoc / protocol / README changes
until `docs:generate` has been run.

## Guardrails

- Frontmatter `id` / `title` must stay stable; they are permalinks.
- Translations are pulled from `webdriverio/i18n` during generate. Do not
  hand-edit `website/i18n/*` except `website/i18n/en`.
- Config keys appear in many examples. Grep the repo, not just `website/`.
- Hosting is Vercel. `website/vercel.json` owns redirects, headers and
  Markdown content negotiation; add a redirect there whenever a page URL
  changes. Production deploys go through the `Docs Deploy` workflow only.
