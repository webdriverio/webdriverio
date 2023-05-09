---
id: v7-migration
title: From v6 to v7
---

This tutorial is for people who are still using `v6` of WebdriverIO and want to migrate to `v7`. As mentioned in our [release blog post](https://webdriver.io/blog/2021/02/09/webdriverio-v7-released) the changes are mostly under the hood and upgrading should be a straight forward process. As mentioned in our [release blog post](https://webdriver.io/blog/2021/02/09/webdriverio-v7-released) the changes are mostly under the hood and upgrading should be a straight forward process.

:::info

If you are using WebdriverIO `v5` or below, please upgrade to `v6` first. Please checkout our [v6 migration guide](v6-migration). Please checkout our [v6 migration guide](v6-migration).

:::

While we would love to have a fully automated process for this the reality looks different. Everyone has a different setup. Every step should be seen as guidance and less like a step by step instruction. While we would love to have a fully automated process for this the reality looks different. Everyone has a different setup. Every step should be seen as guidance and less like a step by step instruction. If you have issues with the migration, don't hesitate to [contact us](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Similar to other migrations we can use the WebdriverIO [codemod](https://github.com/webdriverio/codemod). For this tutorial we use a [boilerplate project](https://github.com/WarleyGabriel/demo-webdriverio-cucumber) submitted by a community member and fully migrate it from `v6` to `v7`. For this tutorial we use a [boilerplate project](https://github.com/WarleyGabriel/demo-webdriverio-cucumber) submitted by a community member and fully migrate it from `v6` to `v7`.

To install the codemod, run:

```sh
npm install jscodeshift @wdio/codemod
```

#### Commits:

- _install codemod deps_ [[6ec9e52]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/6ec9e52038f7e8cb1221753b67040b0f23a8f61a)

## Upgrade WebdriverIO Dependencies

Given that all WebdriverIO versions are tight to each other it is the best to always upgrade to a specific tag, e.g. `latest`. To do so we copy all WebdriverIO related dependencies out of our `package.json` and re-install them via: To do so we copy all WebdriverIO related dependencies out of our `package.json` and re-install them via:

```sh
npm i --save-dev @wdio/allure-reporter@7 @wdio/cli@7 @wdio/cucumber-framework@7 @wdio/local-runner@7 @wdio/spec-reporter@7 @wdio/sync@7 wdio-chromedriver-service@7 wdio-timeline-reporter@7 webdriverio@7
```

Usually WebdriverIO dependencies are part of the dev dependencies, depending on your project this can vary though. After this your `package.json` and `package-lock.json` should be updated. __Note:__ these are the dependencies used by the [example project](https://github.com/WarleyGabriel/demo-webdriverio-cucumber), yours may differ. After this your `package.json` and `package-lock.json` should be updated. __Note:__ these are the dependencies used by the [example project](https://github.com/WarleyGabriel/demo-webdriverio-cucumber), yours may differ.

#### Commits:

- _updated dependencies_ [[7097ab6]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/7097ab6297ef9f37ead0a9c2ce9fce8d0765458d)

## Transform Config File

A good first step is to start with the config file. A good first step is to start with the config file. In WebdriverIO `v7` we don't require to manually register any of the compilers anymore. In fact they need to be removed. This can be done with the codemod full automatically: In fact they need to be removed. This can be done with the codemod full automatically:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./wdio.conf.js
```

:::caution

The codemod doesn't yet support TypeScript projects. See [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). We are working to implement support for it soon. If you are using TypeScript please get involved! See [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). We are working to implement support for it soon. If you are using TypeScript please get involved!

:::

#### Commits:

- _transpile config file_ [[6015534]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/60155346a386380d8a77ae6d1107483043a43994)

## Update Step Definitions

If you are using Jasmine or Mocha, you are done here. If you are using Jasmine or Mocha, you are done here. The last step is to update the Cucumber.js imports from `cucumber` to `@cucumber/cucumber`. This can also be done via the codemod automatically: This can also be done via the codemod automatically:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./src/e2e/*
```

That's it! That's it! No more changes necessary 🎉

#### Commits:

- _transpile step definitions_ [[8c97b90]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/8c97b90a8b9197c62dffe4e2954f7dad814753cc)

## Conclusion

We hope this tutorial guides you a little bit through the migration process to WebdriverIO `v7`. The community continues to improve the codemod while testing it with various teams in various organisations. We hope this tutorial guides you a little bit through the migration process to WebdriverIO `v7`. The community continues to improve the codemod while testing it with various teams in various organisations. Don't hesitate to [raise an issue](https://github.com/webdriverio/codemod/issues/new) if you have feedback or [start a discussion](https://github.com/webdriverio/codemod/discussions/new) if you struggle during the migration process.
