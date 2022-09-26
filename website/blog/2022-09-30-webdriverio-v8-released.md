---
title: WebdriverIO v8 Released
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

While it took a bit longer as expected the WebdriverIO team is excited to announce that we finally released `v8` today! 🎉 🎉 🎉

As with almost all of the last major updates we again had to touch every single file of the project. This time our major goal for the new version was to finally transition from CommonJS to ESM in order to continue with important dependency updates and to avoid security issues. Furthermore we cleaned up some technical depth, e.g removed all code related to syncronous command execution which was [deprecated](https://webdriver.io/blog/2021/07/28/sync-api-deprecation) last year, as well as implemented a new Action API interface and streamlined the way WebdriverIO deals with global objects using the testrunner.

In this blog post we go through every important change and explain what you need to do to upgrade to `v8`. Spoiler alert: in most cases no updates to your tests are necessary 😉

## Drop Node.js v12, v13 and v14 Support

We've dropped support for Node v12 and v14, latter was moved into a maintenance LTS phase by the Node.js team in October 2021. While it is technically fine to use Node.js v14, we don't see a reason why you shouldn't update to Node.js v16 or ideally v18 directly.

To update Node.js, it is important to know how it was installed in the first place. If you are in a Docker environment, you can just upgrade the base image like:

```git
- FROM mhart/alpine-node:14
+ FROM mhart/alpine-node:18
```

We recommend using [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) to install and manage Node.js versions. You can find a detailed description on how to install NVM and update Node in their [project readme](https://github.com/nvm-sh/nvm#installing-and-updating).

## CommonJS to ESM Transition

The transition to the new module system has been the biggest chunk of work related to this release. It required us to update all module imports, transition from Jest to Vitest as unit test framework and rewrite various parts within the code base. While this affected every single file it "should" be unrecognisable for you. If your project still uses CommonJS WebdriverIO will work just fine as both module systems continue to be supported. This is also the case when using `webdriver`, `devtools` or `webdriverio` as [module](/docs/api/modules).

If you have been using Babel only to use `import` statements in your tests, you can remove the integration as this is now supported by ESM natively. If you like to continue using CommonJS and `require`, that is fine too, no changes need to update to `v8`.

## New Action Interface

For many years users that liked to run more complex interactions on their applications using WebDriver's [actions API](https://w3c.github.io/webdriver/#actions) had to know many details about the command in order to construct the correct payload. With `v8` of WebdriverIO we now ship a new interface that makes executing various actions much easier.

With two new browser commands: `action` and `actions`, it is now much simpler and type safe to run the right action, e.g. sending key events to the browser:

```js
await browser.action('key')
    .down('f').up('f')
    .down('o').up('o')
    .down('o').up('o')
    .perform()
```

Read more on the new action interface in the [WebdriverIO API](/docs/api/browser/action).

## Optional Globals

When using the WebdriverIO testrunner it would usually register the `browser` object or the `$` and `$$` command to the global scope as these are usually often used when writing tests. However attaching objects to the global scope is not seen as best practice and can cause side effects when other modules decide to do the same. Therefore with `v8` it is now up to the user whether they like to continue attaching these objects and methods to the global scope or prefer importing them directly, via:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

A new configuration property called [`injectGlobals`](https://v8.webdriver.io/docs/options#injectglobals) (defaults: `true`) handles whether the testrunner modifies the global scope or not. If your set up works fine using global objects, no change is needed to update to `v8`. However we recommend to import WebdriverIO related interfaces directly to ensure no side effects can happen.

If you are using TypeScript, updates to the `tsconfig.json` are necessary to reflect changes made to the location of the WebdriverIO types:

```git
{
    "compilerOptions": {
        "types": [
            "node",
-           "webdriverio/async"
+           "@wdio/globals/types"
        ]
    }
}
```

## Miscellaneous

Aside from these major updates the team has spend time to improve the documentation and introduced new API docs around WebdriverIO objects like [`browser`](/docs/api/browser), [`element`](/docs/api/element) and [`mock`](/docs/api/mock). Furthermore we removed the `config` property from the `browser` object. If you have been using it to access data from the WDIO config, we suggest to replace it with `options`, e.g.:

```git
- browser.config.hostname
+ browser.options.hostname
```

## What's Next?

The WebdriverIO team is very excited about this release as it frees up time to start working on some new cool features we put on the [roadmap](https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md). For many month we have been working secretly on a VS Code Extension that makes authoring and debugging tests much easier. We also started work on a component testing service that enables developers to test individual web components ealier in the pipeline within an actual browser. Aside from that there is always plenty more work to do and opportunities to explore to make this project better. We are welcoming and supporting everyone who likes to join us.

Lastly, I would like to say thank you to everyone who supports the project. Not only the folks who contribute financially through [Open Collective](https://opencollective.com/webdriverio) or [Tidelift](https://tidelift.com/lifter/search/npm/webdriverio) but also everyone who contributes code, ideas, reports issues or supports folks in our [support chat](https://gitter.im/webdriverio/webdriverio), occasionally or on regular basis. Without contributions from the community this project can't go anywhere. Aside from many alternative projects WebdriverIO is not funded, nor driven by any corporate interest and stays 100% community governed. No lack of funding or need for capital gains will have an impact on this project. It has been like this since its inception more than 10 years ago and will continue to be like this for many many more years. Therefore we are always looking for interested folks who like to help us hacking on the project. If you havent', join our [Open Office Hours](https://webdriver.io/community/openofficehours) and consider giving back to the project.

I am looking forward for more years and great feature ahead. Thanks for reading!
