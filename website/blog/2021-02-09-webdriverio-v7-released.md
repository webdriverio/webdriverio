---
title: WebdriverIO v7 Released
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

It's the time of the year where the WebdriverIO project is releasing a new major update. It’s almost become a tradition for us to rewrite the complete code base to further grow the project. When we [announced the v5](/blog/2018/12/19/webdriverio-v5-released) update, we moved from a multi-repository setup to a mono-repo. This time, the rewrite of the code base is just as important and impactful, but comes with almost no implications for the end user. As more and more contributors have joined the project, we've noticed that using pure JavaScript can be helpful to keep the entry barrier for contributions low, but that it ultimately decreases the quality of contributions overall. With the growing size of the code in the project, keeping up with all the different types that were thrown around was becoming more difficult for us as core contributors. Since we already had a lot of TypeScript fans among us, we decided to move to TypeScript quickly after meeting at the [OpenJS Collaborator Summit](https://youtu.be/HqIstZSsCTA).

Our hope is that by moving to TypeScript, fewer bugs will be introduced during continued development on the framework. It will help improve the quality of code contributions and the speed of development of certain features. It also brings more confidence in new versions that we ship to the user.

This major update will largely only impact TypeScript users as we have updated types in all places and changed the way we distribute them. As part of the rewrite, we upgraded to Cucumber v7, which also moved its codebase to TypeScript. Because of that we had to update some of the Cucumber hooks to ensure they come with proper type safety. In the following we go into every major change and will describe how you can upgrade to v7.

## Drop Node v10 Support

We've dropped support for Node v10, which was moved into a maintenance LTS phase by the Node.js team in May 2020. While this version still receives important security updates until April 2021, we recommend updating your Node.js version to v14 or higher.

To update Node.js, it is important to know how it was installed in the first place. If you are in a Docker environment, you can just upgrade the base image like:

```git
- FROM mhart/alpine-node:10
+ FROM mhart/alpine-node:14
```

We recommend using [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) to install and manage Node.js versions. You can find a detailed description on how to install NVM and update Node in their [project readme](https://github.com/nvm-sh/nvm#installing-and-updating).

## TypeScript Rewrite

We have rewritten the complete code base and almost touched all files to add type safety and to fix a lot of bugs on the way. This was a true community effort and would have taken much longer if we didn’t have so many people helping with code contributions. Thank you all for that ❤️! Before, WebdriverIO auto-generated all type definitions, which caused the creation of a lot of duplicate types and inconsistency. With this overhaul, all types are directly taken from the code itself and centralized in a single new helper package called [`@wdio/types`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-types). If you have been using TypeScript, you will now have much better type support for various commands and the configuration file.

There are two significant changes how this TypeScript rewrite will impact you. Instead of just defining `webdriverio` in your types you now need to set `@wdio/globals/types`:

```git
// tsconfig.json
"types": [
  "node",
-  "webdriverio",
+  "@wdio/globals/types",
  "@wdio/mocha-framework"
],
```

Lastly, if you define custom commands, you need to provide their types slightly different now, if using module-style type definition files (type definition file uses import/export; tsconfig.json contains `include` section):

```ts
// define custom commands in v6
declare namespace WebdriverIO {
    // adding command to `browser`
    interface Browser {
        browserCustomCommand: (arg: number) => void
    }
}
```
this now has to be:
```ts
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: number) => void
        }
    }
}
```
Otherwise, if using ambient type definition files (no include section in tsconfig, no import/export in type definition file), then keep the custom command declaration the same as before, since including the `global` declaration as above will require the type definition file to be changed to a module.

Alongside with this change we also equipped the testrunner to auto-compile your configuration if TypeScript is detected, this allows to leverage type safety in your WDIO configuration without any additional setup (big thanks for this contribution goes to [@r4j4h](https://github.com/r4j4h)). With that you also don't need `ts-node/register` to be required in your Mocha, Jasmine or Cucumber options, e.g.:

```suggestion
jasmineOpts: {
    - requires: ['ts-node/register', 'tsconfig-paths/register'],
    + requires: ['tsconfig-paths/register'],
},
```

You can read more about WebdriverIO TypeScript integration in our [docs](/docs/typescript).

## Cucumber v7 Update

The folks working on Cucumber have done a tremendous job moving their code base to TypeScript, which has made our lives tremendously easier. The new Cucumber integration required us to update the parameters within our [Cucumber hooks](/docs/configuration#beforefeature).

If you have been using Cucumber, all you need to do to update to v7 is to update your Cucumber imports to their new package:

```git
- const { Given, When, Then } = require('cucumber')
+ const { Given, When, Then } = require('@cucumber/cucumber')
```

## Improved Google Lighthouse Integration

Since v6 WebdriverIO can run on the [WebDriver protocol](https://w3c.github.io/webdriver/) for true cross browser automation, but also automate specific browsers using browser APIs such as [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/). This allows for interesting integrations into tools that allow broader testing capabilities such as [Google Lighthouse](https://developers.google.com/web/tools/lighthouse). With the `@wdio/devtools-service`, WebdriverIO users were able to access these capabilities using Google Lighthouse to run [performance tests](https://www.youtube.com/watch?v=Al7zlLdd_es). In this release, we’ve also updated Google Lighthouse to the latest version to enable new performance metrics such as [Cumulative Layout Shifts](https://web.dev/cls/) or [First Input Delay](https://web.dev/fid/).

:::info Update

With WebdriverIO v9 we have deprecated the Devtools Service and transitioned many functionalities to a Lighthouse Service (`@wdio/lighthouse-service`). We recommend users to transition to the Puppeteer interface (via the `getPuppeteer` command) to access Chrome Devtools capabilities.

:::

While in v6 performance tests were automatically run on a mobile environment, we have decided to change this and make the default behavior more obvious. Therefore, if you run performance tests in v7, there aren't any changes to the environment where you run your tests. We still recommend emulating a mobile device to more accurately capture the user experience of users most impacted by bad application performance. To do so, you can run the following commands:

```js
browser.emulateDevice('iPhone X')
browser.enablePerformanceAudits({
    networkThrottling: 'Regular 3G',
    cpuThrottling: 4,
    cacheEnabled: false,
    formFactor: 'mobile'
})
```

The `formFactor` property has been added with the update to Google Lighthouse v7, which determines how performance metrics are scored and if mobile-only audits are skipped.

### New PWA Check Command

In addition,  we have deepened our integration to the tool and added audits for capturing the quality of your [progressive web apps](https://web.dev/progressive-web-apps/) (PWA). These applications are built with modern web APIs to deliver enhanced capabilities, reliability, and installability while reaching anyone, anywhere, on any device with a single codebase. To test if your application fulfills the PWA requirements we have introduced a `checkPWA` command that runs a variety of audits, validating the set up of your app:

```js
const result = browser.checkPWA()
expect(result.passed).toBe(true)
```

We will continue to add more integrations into tools like Google Lighthouse to provide more testing capabilities, e.g. accessibility, best practices and SEO.

## Auto Compiling

In v7 of WebdriverIO we made using compiler tools like Babel or TypeScript a lot easier. The testrunner can now automatically compile the config if it finds the necessary packages in your modules. Usually these had to be defined in your framework options like so:

```js
    mochaOpts: {
        ui: 'bdd',
        require: ['@babel/register'],
        // ...
    },
```

These settings need to be removed now as WebdriverIO automatically includes them. Read more about how to set up [Babel](/docs/babel) or [TypeScript](/docs/typescript) in our docs.

## Stricter Protocol Compliance

The WebDriver protocol has been upgraded to a W3C recommended standard since 2018. A lot of cloud vendors and tools have been able to update their implementation making all artifacts of the JSONWireProtocol obsolete. The WebdriverIO projects wants to support this transition by adding additional checks to its capability configuration to ensure users don't accidentally send a mixture of both protocols resulting in an unexpected behavior. With the new version your session request will automatically fail if you send incompatible capabilities along, e.g.:

```js
capabilities: {
    browserName: 'Chrome',
    platform: 'Windows 10', // invalid JSONWire Protocol capability
    'goog:chromeOptions': { ... }
}
```

## Test Coverage Reporting

The [`@wdio/devtools-service`](https://www.npmjs.com/package/@wdio/devtools-service) now offers to capture the code coverage of your JavaScript application files. This can help you to identify whether you should write more e2e tests or not. To enable the feature you have to enable it by setting the coverageReporter option for the service:

```js
// wdio.conf.js
services: [
    ['devtools' {
        coverageReporter: {
            enable: true,
            type: 'html',
            logDir: __dirname + '/coverage'
        }
    }]
]
```

You can also assert the code coverage within your tests using the new `getCoverageReport` command, e.g.:

```js
const coverage = browser.getCoverageReport()
expect(coverage.lines.total).toBeAbove(0.9)
expect(coverage.statements.total).toBeAbove(0.9)
expect(coverage.functions.total).toBeAbove(0.9)
expect(coverage.branches.total).toBeAbove(0.9)
```

## New Docs

As you might already have seen, we have updated our [docs](https://webdriver.io) to give this new release a brand new face. We've upgraded our Docusaurus setup to v2 and gave the whole design a new touch. Big shout out to [Anton Meier](https://www.linkedin.com/in/antoschka-kartoschka) for helping us out and making our robot on the front page so lively.

That's it! We hope you enjoy the new version and update your framework soon-ish to get all these new features, type safety and bug fixes for your projects. If you have any questions don't hesitate to start a conversation on the [discussions page](https://github.com/webdriverio/webdriverio/discussions) or join our growing [support chat](https://discord.webdriver.io) that has already reached 6.7k active members.
