---
cwd: ../
---

# Documentation

This repository contains everything to set up, build and deploy the WebdriverIO documentation pages. We are using [Docusaurus](https://docusaurus.io/) (v2) to generate the page. The content is generated based off:

- the guidelines pages from markdown files of the [docs directory](https://github.com/webdriverio/webdriverio/tree/main/website/docs)
- service and reporter docs from the readme files of those packages within this repository
- service and reporter docs from 3rd party plugins (defined in [these JSON files](https://github.com/webdriverio/webdriverio/tree/main/scripts/docs-generation/3rd-party)) that are downloaded from GitHub and parsed
- the protocol APIs from the [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) package
- the WebdriverIO API that is parsed out of the JSDoc comments of individual commands (e.g., [`execute`](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/commands/browser/execute.ts#L3-L37) command)

Changes to the docs need to be done in one of these places. Please note that changes to e.g. the config file have to be updated in multiple places given that config files are wide spread (as examples or test files) within this repository. A good way to go about this is to look for all occurrences of a certain string of the config and update changes in all findings.

The easiest way to get a version of the documentation run locally is via:

```sh { name=docs }
npx runme run docs-clean docs-install docs-generate docs-start
```

## Setup Docusaurus

After you have [set up the project](./Setup.md) you can go into the `website` directory to set up the docs page and run it on your local machine.

To do so, install first the required dependencies:

```sh { name=docs-install }
cd website
npm install
```

## Generate Documentation

The project pulls its documentation from various sources (see above). To run this process, first clean potentially old documentation via:

```sh { name=docs-clean }
npx rimraf website/docs/_*.md website/docs/api/_*.md website/docs/api/**/_*.md website/sidebars.json
```

then re-generate them:

```sh { name=docs-generate }
ts-node-esm ./scripts/docs-generation/generateDocs.ts
```

## Start Local Development

You can run a local dev server via:

```sh { name=docs-start }
cd website
npx docusaurus start
```

This will set up everything needed to run the page on [`localhost:3000`](http://localhost:3000/). You can now modify the content of the [`/website/docs`](https://github.com/webdriverio/webdriverio/tree/main/website/docs) files as well as change styles and templates. The page will be automatically updated. If you add documentation in other places, you have to rerun the `npx runme run docs` script to re-generate the docs.

## Build Static Files

You can build the website and have all static files ready at `./website/build` via:

```sh { name=docs-build }
cd ./website
docusaurus build
```

### Deploying the Documentation in Production

Every time a new release is pushed to GitHub the WebdriverIO docs need to be build and re-deployed to the project's S3 bucket. The process is defined in a GitHub Actions [pipeline](https://github.com/webdriverio/webdriverio/blob/main/.github/workflows/deploy.yml). All you need to do (as maintainer) is to trigger the pipeline. The rest is handled by the workflow.

To deploy the website manually, make sure you have the following environment variables set:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DISTRIBUTION_ID`

then run:

```sh { name=docs-deploy }
node ./scripts/updateDocs.js
```
