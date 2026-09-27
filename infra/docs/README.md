# Documentation Generation

Internal package that builds the content of [webdriver.io](https://webdriver.io) from sources across this repository and a few external ones. It is not published to NPM.

## What it generates

- protocol API pages from `@wdio/protocols`
- WebdriverIO command pages from JSDoc comments in `packages/webdriverio/src/commands`
- reporter and service pages from package READMEs
- the ecosystem directory of official and community plugins
- 3rd-party plugin pages listed in [`src/3rd-party`](./src/3rd-party)
- community event pages from `https://events.webdriver.io`
- Electron / Tauri / Dioxus desktop-testing docs from `webdriverio/desktop-mobile`
- contributing guidelines and awesome-resources pages
- translated docs from `webdriverio/i18n`

The built site is deployed to Vercel by `.github/workflows/deploy.yml`.

## Workflow

From the repo root:

```sh
# generate markdown into website/ (includes translation download)
pnpm run docs:generate

# English only, for local preview
pnpm run docs:generate:en

# sidebar coverage, preserved URLs, and llms.txt links
pnpm run docs:check

# retrieval eval against a built site
pnpm run docs:eval
```

`docs:generate` requires `GITHUB_AUTH` so translations can be downloaded from `webdriverio/i18n`.

## Adding a 3rd-party plugin

Add an entry to the matching JSON file in [`src/3rd-party`](./src/3rd-party) and regenerate the docs.
