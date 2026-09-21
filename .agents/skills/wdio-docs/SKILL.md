---
name: wdio-docs
description: Find the source of a WebdriverIO docs page and regenerate the site without editing generated files.
---

# WDIO docs

Use this skill when the task is documentation, JSDoc, protocol descriptions,
or the Docusaurus site. Read [website/AGENTS.md](../../../website/AGENTS.md).

## Find the source

```sh
pnpm run docs:list
```

Then edit the *source*, not the generated page:

| User-facing page | Source |
|------------------|--------|
| Guides / flowcharts | `website/docs/**/*.md` |
| Command API (`browser.url`, `$().click`, …) | JSDoc on `packages/webdriverio/src/commands/**` |
| Protocol API | `packages/wdio-protocols/src/protocols/*.ts` |
| Built-in service or reporter | that package's `README.md` |
| Community plugin | `scripts/docs-generation/3rd-party/` |
| Contributing page on the site | `CONTRIBUTING.md` (copied during generate) |

Do not edit `website/docs/api/**` (except the few hand-written files in
`.gitignore` exceptions), `website/docs/_*.md`, or `website/sidebars.json`.

## Verify

```sh
pnpm run docs:generate
# optional local preview
cd website && pnpm install && pnpm start
```

Docs-only PRs do not need unit or smoke tests. If you changed a command's
JSDoc *and* its behavior, follow the testing skill as well.

## Config keys

A configuration property is documented in several places (guides, examples,
`tests/helpers`, `create-wdio` templates). Grep the identifier and update
every user-facing copy, or say which copies you left alone and why.
