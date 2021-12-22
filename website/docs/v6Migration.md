---
id: v6-migration
title: From v5 to v6
---

This tutorial is for people who are still using `v5` of WebdriverIO and want to migrate to `v6` or to the latest version of WebdriverIO. As mentioned in our [release blog post](https://webdriver.io/blog/2020/03/26/webdriverio-v6-released) the changes for this version upgrade can be summarised as following:

- we consolidated the parameters for some commands (e.g. `newWindow`, `react$`, `react$$`, `waitUntil`, `dragAndDrop`, `moveTo`, `waitForDisplayed`, `waitForEnabled`, `waitForExist`) and moved all optional parameters into a single object, e.g.

    ```js
    // v5
    browser.newWindow(
        'https://webdriver.io',
        'WebdriverIO window',
        'width=420,height=230,resizable,scrollbars=yes,status=1'
    )
    // v6
    browser.newWindow('https://webdriver.io', {
        windowName: 'WebdriverIO window',
        windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1'
    })
    ```

- configurations for services moved into the service list, e.g.

    ```js
    // v5
    exports.config = {
        services: ['sauce'],
        sauceConnect: true,
        sauceConnectOpts: { foo: 'bar' },
    }
    // v6
    exports.config = {
        services: [['sauce', {
            sauceConnect: true,
            sauceConnectOpts: { foo: 'bar' }
        }]],
    }
    ```

- some service options were renamed for simplification purposes
- we renamed command `launchApp` to `launchChromeApp` for Chrome WebDriver sessions

:::info

If you are using WebdriverIO `v4` or below, please upgrade to `v5` first.

:::

While we would love to have a fully automated process for this the reality looks different. Everyone has a different setup. Every step should be seen as guidance and less like a step by step instruction. If you have issues with the migration, don't hesitate to [contact us](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Similar to other migrations we can use the WebdriverIO [codemod](https://github.com/webdriverio/codemod). To install the codemod, run:

```sh
npm install jscodeshift @wdio/codemod
```

## Upgrade WebdriverIO Dependencies

Given that all WebdriverIO versions are tight to each other it is the best to always upgrade to a specific tag, e.g. `6.12.0`. If you decide to upgrade from `v5` directly to `v7` you can leave out the tag and install latest versions of all packages. To do so we copy all WebdriverIO related dependencies out of our `package.json` and re-install them via:

```sh
npm i --save-dev @wdio/allure-reporter@6 @wdio/cli@6 @wdio/cucumber-framework@6 @wdio/local-runner@6 @wdio/spec-reporter@6 @wdio/sync@6 wdio-chromedriver-service@6 webdriverio@6
```

Usually WebdriverIO dependencies are part of the dev dependencies, depending on your project this can vary though. After this your `package.json` and `package-lock.json` should be updated. __Note:__ these are example dependencies, yours may differ. Make sure you find the latest v6 version by calling, e.g.:

```sh
npm show webdriverio versions
```

Try to install the latest version 6 available for all core WebdriverIO packages. For community packages this can differ from package to package. Here we recommend to check the changelog for information on which version is still compatible with v6.

## Transform Config File

A good first step is to start with the config file. All breaking changes can be resolve using the codemod full automatically:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./wdio.conf.js
```

:::caution

The codemod doesn't yet support TypeScript projects. See [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). We are working to implement support for it soon. If you are using TypeScript please get involved!

:::

## Update Spec Files and Page Objects

In order to update all command changes run the codemod on all your e2e files that contain WebdriverIO commands, e.g.:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./e2e/*
```

That's it! No more changes necessary 🎉

## Conclusion

We hope this tutorial guides you a little bit through the migration process to WebdriverIO `v6`. We strongly recommend to continue upgrading to the latest version given that updating to `v7` is trivial due to almost no breaking changes. Please check out the migration guide [to upgrade to v7](v7-migration).

The community continues to improve the codemod while testing it with various teams in various organisations. Don't hesitate to [raise an issue](https://github.com/webdriverio/codemod/issues/new) if you have feedback or [start a discussion](https://github.com/webdriverio/codemod/discussions/new) if you struggle during the migration process.
