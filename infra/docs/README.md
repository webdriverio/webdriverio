# Documentation Generation

Internal package that builds the content of [webdriver.io](https://webdriver.io) from sources across this repository and a few external ones. It is not published to NPM.

## What it generates

- protocol API pages from `@wdio/protocols`
- WebdriverIO command pages from JSDoc comments in `packages/webdriverio/src/commands`
- reporter and service pages from package READMEs
- 3rd-party plugin pages listed in [`src/3rd-party`](./src/3rd-party)
- community event pages from `https://events.webdriver.io`
- Electron / Tauri / Dioxus desktop-testing docs from `webdriverio/desktop-mobile`
- contributing guidelines and awesome-resources pages
- translated docs from `webdriverio/i18n`

After generation it can upload the Docusaurus build to the `webdriver.io` S3 bucket and invalidate CloudFront.

## Workflow

From the repo root:

```sh
# generate markdown into website/
pnpm run docs:generate
# equivalent:
pnpm -r --filter=@wdio/docs run generate

# upload website/build to S3 (used by .github/workflows/deploy.yml)
pnpm run docs:deploy
# equivalent:
pnpm -r --filter=@wdio/docs run deploy
```

`docs:generate` requires `GITHUB_AUTH` so translations can be downloaded from `webdriverio/i18n`. `docs:deploy` additionally needs AWS credentials and a CloudFront `DISTRIBUTION_ID`.

## Adding a 3rd-party plugin

Add an entry to the matching JSON file in [`src/3rd-party`](./src/3rd-party) and regenerate the docs.
