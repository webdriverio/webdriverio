---
title: WebdriverIO v9 Released
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

The whole Webdriverio development team is stoked and proud to release WebdriverIO v9 today! 🎉 🎉 🎉

This marks the begin of a new exciting era for all projects using WebdriverIO as their test automation tool. With the great work of browser teams that are working on e.g. Chrome and Firefox, we now enter a new era that offers much greater automation capabilities than ever before thanks to the new [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol. With WebdriverIO v9 we have been working to be at the forefront of adopters of this new era and allow you to leverage from the power of the protocol first.

Let's walk through the release and take a look at all the new features, updates and optimizations that this release entails.

## New Features

Almost all of the new features coming to v9 are all possible, thanks to new capabilities brought by WebDriver Bidi and landed in browsers today. If you update to v9 all sessions will automatically run with Bidi enabled, unless you explicitly disable it via the new `wdio:enforceWebDriverClassic` capability.

### New `url` Command Parameters

The `url` command use to be a very simple command that would allow the browser to navigate to certain application to start testing it. In v9 this command now has received some super powers.

#### Passing in Custom Headers

You can pass in custom headers that will be applied when the browser makes the request. This will be useful to e.g. set a session cookie to automatically be logged in.

```ts
await browser.url('https://webdriver.io', {
    headers: {
        Authorization: 'Bearer XXXXX'
    }
});
```

#### Overcome Basic Authentification

What used to be very difficult to automate is now very easy: authenticating a user via [basic authentification](https://en.wikipedia.org/wiki/Basic_access_authentication):

```ts
await browser.url('https://the-internet.herokuapp.com/basic_auth', {
    auth: {
        user: 'admin',
        pass: 'admin'
    }
});
await expect($('p=Congratulations! You must have the proper credentials.').toBeDisplayed();
```

#### Running an Initialization Script

In cases where you would like to run some JavaScript before everything else is loaded on the website, you can use the `beforeLoad` parameter to inject a script into the execution context of the site. This is particularly useful if you like to overwrite Web APIs that your application is using to make them behave a certain way.

```ts
// navigate to a URL and mock the battery API
await browser.url('https://pazguille.github.io/demo-battery-api/', {
    onBeforeLoad (win) {
        // mock "navigator.battery" property
        // returning mock charge object
        win.navigator.getBattery = () => Promise.resolve({
            level: 0.5,
            charging: false,
            chargingTime: Infinity,
            dischargingTime: 3600, // seconds
        })
    }
})
// now we can assert actual text - we are charged at 50%
await expect($('.battery-percentage')).toHaveText('50%')
// and has enough juice for 1 hour
await expect($('.battery-remaining')).toHaveText('01:00)
```

### Automatic Shadow Root Piercing

Web Components [are definitely a thing today](https://arewebcomponentsathingyet.com/) but testing applications that heavily rely on Web Components has been very cumbersome due to the encapsulating nature of [Shadow Roots](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot). With WebdriverIO v9 this belongs to the past as the framework now automatically keeps track of all `ShadowRoot` nodes in the document and automatically searches across all of them,
independant of the mode being `open` or `closed`.

For example, let's say we want to automate the following Date Picker component that contains multiple nested shadow roots:

<iframe title="Date Picker" height="400" width="100%" src="https://ionicframework.com/docs/usage/v8/datetime/basic/demo.html?ionic:mode=md"></iframe>

In order to change the time, you can call:

### Improved Argument Serialization

With WebDriver Classic the ability to move data objects from the Test to the browser environment was rather limited to DOM elements and serializable objects and types. With WebDriver Bidi we are now able to do a better job transforming non-serializable data objects to be used in the browser as the object that it is. Alongside known JavaScript primitives such as `Map` or `Set`, the protocol allows to serialize values such as `Infinity`, `null`, `undefined` and `BigInt`.

Here is an example where we compose a JavaScript Map object in Node.js and pass it over to the browser where it gets automatically deserialzed back into a Map and vise versa:

```ts
const data = new Map([
    ['username', 'Tony'],
    ['password', 'secret']
])
const output = await browser.execute(
    (data) => `${data.size} entrie(s), username: ${data.get('username')}, password: ${data.get('secret')}`,
    data
)

console.log(output)
// outputs: "1 entrie(s), username: Tony, password: secret"
```

This will make it easier pass data along and work with custom scripts that can now return rich data objects that will help better observe the state of your application. It will allow frameworks like WebdriverIO to integrate deeper with the browser environment and build more useful features in the future.

### Setting Viewports

...



While it took a bit longer than expected the WebdriverIO team is excited to announce that we finally released `v8` today!

As with almost all of the last major updates we again had to touch every single file of the project. This time our major goal for the new version was to finally transition from CommonJS to ESM which enables us to continue with important dependency updates and avoid security issues. Furthermore, we cleaned up some technical debt, e.g. removed all code related to synchronous command execution which was [deprecated](https://webdriver.io/blog/2021/07/28/sync-api-deprecation) last year, as well as implemented a new Action API interface and streamlined the way WebdriverIO deals with global objects using the test runner.

In this blog post, we go through every important change and explain what you need to do to upgrade to `v8`. Spoiler alert: in most cases no updates to your tests are necessary 😉

## Drop Node.js v12, v13 and v14 Support

We've dropped support for Node v12 and v14, latter was moved into a maintenance LTS phase by the Node.js team in October 2021. While it is technically fine to continue using Node.js v14, we don't see a reason why you shouldn't update to Node.js v16 or ideally v18 directly.

To update Node.js, it is important to know how it was installed in the first place. If you are in a Docker environment, you can just upgrade the base image like:

```git
- FROM mhart/alpine-node:14
+ FROM mhart/alpine-node:18
```

We recommend using [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) to install and manage Node.js versions. You can find a detailed description of how to install NVM and update Node in their [project readme](https://github.com/nvm-sh/nvm#installing-and-updating).

## CommonJS to ESM Transition

The transition to the new module system has been the biggest chunk of work related to this release. It required us to update all module imports, transitioning from [Jest](https://jestjs.io/) to [Vitest](https://vitest.dev/) as a unit test framework and rewrite various parts within the code base. While this affected every single file it "should" be unrecognizable to you. If your project still uses CommonJS, WebdriverIO will work just fine as both module systems continue to be supported. This is also the case when using `webdriver`, `devtools` or `webdriverio` as a [module](/docs/api/modules).

If you have been using Babel only to use `import` statements in your tests, you can remove the integration as this is now supported by ESM natively. If you like to continue using CommonJS and `require`, that is fine too, no changes are needed to update to `v8`.

## A new Runner for Unit and Component Testing in the Browser

If it comes to one feature we are really excited about in this release it is the new browser runner 🙌 I've been writing and testing a lot of web components in this past year and was always frustrated about the fact that they would be tested against [JSDOM](https://www.npmjs.com/package/jsdom) rather than an actual browser. JSDOM is a re-implementation of many Web APIs in Node.js and is a great tool for simple testing but it doesn't replace an actual DOM implementation within a browser. Especially using JSDOM for component testing has [various disadvantages](/docs/runner#browser-runner) compared to running tests in the browser.

Furthermore running component tests through WebdriverIO allows to use the WebdriverIO [API](/docs/api) seamlessly and enables real user interaction with your components through the [WebDriver protocol](https://w3c.github.io/webdriver/). This makes those interactions more realistic compared to emitting them through JavaScript. It comes also with 1st class support for popular utility frameworks such as [Testing Library](https://testing-library.com/) and allows to use both APIs interchangeably. Check out how you can use Testing Library for rendering and fetching elements while using WebdriverIO for interacting with the component:

```ts title="vue.test.ts"
import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import Component from './components/Component.vue'

describe('Vue Component Testing', () => {
    it('increments value on click', async () => {
        // The render method returns a collection of utilities to query your component.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('Times clicked: 0')

        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2') // assert with Testing Library
        await expect($('p=Times clicked: 2')).toExist() // assert with WebdriverIO
    })
})
```

The new browser runner allows you to load and execute tests within the browser rather than in Node.js. This allows you to access all Web APIs to render web components or to run unit tests for your frontend modules. Under the hood it uses [Vite](https://vitejs.dev/) to load all dependencies and make the integration seamless.

If you have been using [Karma](https://github.com/karma-runner/karma) for running unit tests in the browser you can switch over to WebdriverIO which provides the same capabilities but offers better support and integration to other services and reporters. It also seems that the Karma project is not much maintained these days and has [unresovled security vulnerabilities](https://github.com/karma-runner/karma/issues/3823).

## New Action Interface

For many years users that liked to run more complex interactions on their applications using WebDriver's [actions API](https://w3c.github.io/webdriver/#actions) had to know many details about the command to construct the correct payload. With `v8` of WebdriverIO, we now ship a new interface that makes executing various actions much easier.

With two new browser commands: `action` and `actions`, it is now much simpler and type-safe to run the right action, e.g. sending key events to the browser:

```js
await browser.action('key')
    .down('f').up('f')
    .down('o').up('o')
    .down('o').up('o')
    .perform()
```

Read more on the new action interface in the [WebdriverIO API](/docs/api/browser/action).

## WebDriver BiDi Support

A strong argument to use WebdriverIO as opposed to other tools is the fact that it is based on the [WebDriver protocol](https://w3c.github.io/webdriver/), which is a web standard for automating browsers. It guarantees the ability to run tests in browsers that are used by your users as opposed to a browser engine, which can be very different from a feature and security aspect. The [W3C Working Group](https://www.w3.org/groups/wg/browser-tools-testing) has been working on [a new version](https://w3c.github.io/webdriver-bidi/) of the protocol that will enable better introspection capabilities and new automation primitives.

With this release, users can start accessing these new protocol features as they become available in browsers. Over time more commands will transition to the new protocol under the hood while the interface remains the same. We are all very excited about the new capabilities and opportunities this protocol will provide, e.g. listening to log events while running tests, e.g.:

```ts
await browser.send({
    method: 'session.subscribe',
    params: { events: ['log.entryAdded'] }
})

/**
 * returns:
 * {
 *    "method":"log.entryAdded",
 *    "params":{
 *       "type":"console",
 *       "method":"log",
 *       "realm":null,
 *       "args":[
 *          {
 *             "type":"string",
 *             "value":"Hello Bidi"
 *          }
 *       ],
 *       "level":"info",
 *       "text":"Hello Bidi",
 *       "timestamp":1657282076037
 *    }
 * }
 */
browser.on('message', (data) => console.log('received %s', data))

/**
 * trigger listener
 */
await browser.execute(() => console.log("Hello Bidi"))
```

We are following and supporting the development of all browser vendors to ensure new features are working as expected and can be used through a lean user interface. For more information on this topic check out my talk on [The Evolution of Browser Automation](https://www.youtube.com/watch?v=z9v5v1MZ2Y0).

## Optional Globals

When using the WebdriverIO test runner it would usually register the `browser` object or the `$` and `$$` command to the global scope as these are usually often used when writing tests. However, attaching objects to the global scope is not seen as best practice and can cause side effects when other modules decide to do the same. Therefore with `v8`, it is now up to the user whether they like to continue attaching these objects and methods to the global scope or prefer importing them directly, via:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

A new configuration property called [`injectGlobals`](https://v8.webdriver.io/docs/options#injectglobals) (defaults: `true`) handles whether the test runner modifies the global scope or not. If your setup works fine using global objects, no change is needed to update to `v8`. However, we recommend importing WebdriverIO-related interfaces directly to ensure no side effects can happen.

__Note:__ If you are using TypeScript, updates to the `tsconfig.json` are necessary to reflect changes made to the location of the WebdriverIO types. These are now part of the `@wdio/globals` package:

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

Aside from these major updates, the team has spent time improving the documentation and introduced new API docs around WebdriverIO objects like [`browser`](/docs/api/browser), [`element`](/docs/api/element) and [`mock`](/docs/api/mock). Furthermore, we removed the `config` property from the `browser` object. If you have been using it to access data from the WDIO config, we suggest replacing it with `options`, e.g.:

```git
- browser.config.hostname
+ browser.options.hostname
```

Furthermore did we fix the behavior of relative spec or exclude paths. Before `v8` every path within `specs`, `exclude` or `--spec` was always seen relative from the users working directory. This behavior was confusing especially when the `wdio.conf.js` was not within the root of you project. This got fixed now so that `specs` and `exclude` path will be always seen as relative to the config file and `--spec` arguments, relative from the working directory.

Lastly, we had to remove support for [tsconfig-paths](https://www.npmjs.com/package/tsconfig-paths) as we haven't found a way to get it working within an ESM context. We believe this integration hasn't been used much anyway and a lot of it is nowadays natively supported in TypeScript. Let us know if this assumption is wrong and you would like to see it being supported again.

## What's Next?

The WebdriverIO team is very excited about this release as it frees up time to start working on some new cool features we put on the [roadmap](https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md). For many months we have been working secretly on a VS Code Extension that makes authoring and debugging tests much easier. Aside from that, there is always plenty more work to do and opportunities to explore to make this project better. We are welcoming and supporting everyone who likes to join us.

Lastly, I would like to say thank you to everyone who supports the project. Not only the folks who contribute financially through [Open Collective](https://opencollective.com/webdriverio) or [Tidelift](https://tidelift.com/lifter/search/npm/webdriverio) but also everyone who contributes code, ideas, reports issues or supports folks in our [support chat](https://discord.webdriver.io), occasionally or on regular basis. Without contributions from the community, this project can't go anywhere. Aside from many alternative projects WebdriverIO is not funded, nor driven by any corporate interest and stays 100% community governed. No lack of funding or need for capital gains will have an impact on this project. It has been like this since its inception more than 10 years ago and will continue to be like this for many many more years. Therefore we are always looking for interested folks who like to help us hack on the project. If you haven't, join our [Open Office Hours](https://webdriver.io/community/openofficehours) and consider giving back to the project.

I am looking forward to more years and great features ahead. Thanks for reading!
