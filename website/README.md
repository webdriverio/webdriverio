# webdriver.io

The source of [webdriver.io](https://webdriver.io), built with [Docusaurus 3](https://docusaurus.io) and hosted on [Vercel](https://vercel.com). Many pages are generated from the monorepo (command JSDoc, protocol specs, package READMEs), see [`AGENTS.md`](./AGENTS.md) for what is hand-written and what is generated.

## Local Development

From the repository root:

```sh
pnpm install
pnpm run docs:generate   # generate API, protocol and package pages
cd website
pnpm start               # dev server on http://localhost:3000
```

`pnpm start` also runs the generation step, so re-run it after changing JSDoc, protocol specs or package READMEs.

## Build

```sh
pnpm exec docusaurus build --locale en   # fast, English only
pnpm run build                           # all locales, as deployed to production
pnpm run serve                           # serve the build locally
```

Every page is also emitted as Markdown (`/docs/<page>.md`), and `llms.txt` / `llms-full.txt` are written to the build root.

## Deployment

The site is built on GitHub Actions and the prebuilt output is deployed to Vercel by [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

- pull requests that touch the docs get a preview deployment, the URL is posted on the PR
- production deploys are triggered manually by a maintainer

Redirects, response headers and Markdown content negotiation live in [`vercel.json`](./vercel.json).
