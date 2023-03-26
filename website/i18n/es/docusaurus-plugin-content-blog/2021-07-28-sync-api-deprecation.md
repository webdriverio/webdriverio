---
title: Sync API Deprecation
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

For many years one of the selling features of the WebdriverIO framework was its synchronous API. Especially for folks coming from more synchronous oriented languages such as Java or Ruby, it has helped to avoid race conditions when executing commands. But also people that are more familiar with [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) tend to prefer synchronous execution as it made the code easier to read and handle.

Running asynchronous commands in a synchronous way was possible with the help of the [`@wdio/sync`](https://www.npmjs.com/package/@wdio/sync) package. If installed, WebdriverIO would automatically wrap the commands with utility methods that were using the [`fibers`](https://www.npmjs.com/package/fibers) package to create a synchronous execution environment. It uses some internal V8 APIs to allow to jump between multiple call stacks from within a single thread. This approach also has been popular among other projects, e.g. [Meteor](https://www.meteor.com/), where most of the code is written using asynchronous APIs which causes developers to constantly start the line of code with `await`.

Last year the [author](https://github.com/laverdet) of the Fibers package [announced](https://github.com/laverdet/node-fibers/commit/e2a0ed9c6d985f94c2b1947eaf72d5797e8a3278) that he would no longer continue to maintain the project anymore. He built Fibers when JavaScript did not have any proper mechanism to handle asynchronous code other than using callbacks. With JavaScript evolving and adding APIs like [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or [Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) there is technically no reason anymore for Fibers to exist other than preference of code style. Now with the release of Node.js v16 and the update to [V8](https://v8.dev/) v9 Fibers stopped working due to a [change in V8](https://chromium-review.googlesource.com/c/v8/v8/+/2537690) that would remove some internal interfaces Fibers was using. Given that a fix for this is non trivial and the maintainer already stepped down from the project it is unlikely that we will see support for Fibers in Node.js v16 and on.

After the WebdriverIO team discovered this we immediately took action and evaluated our options. We opened an [RFC](https://github.com/webdriverio/webdriverio/discussions/6702) to discuss with the community in which direction the project should go. I would like to thank everyone who chimed in and provided their opinion. We experimented with some alternative options, e.g. using Babel to transpile synchronous code into asynchronous but they all failed due to various reasons. The ultimate decision was made to accept the fact that synchronous command execution won't be possible moving on and rather embrace asynchronicity.

With the release of WebdriverIO `v7.9` we are happy to announce that we improved our asynchronous API and matched it with the synchronous one. When chaining element command calls users had to write aweful code like this before:

```js
await (await (await $('#foo')).$$('.bar'))[42].click()
```

now this got simiplified to this:

```js
await $('#foo').$$('.bar')[42].click()
```

Thanks to the enormous power of the [Proxy Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) the API is now much more streamlined and less verbose. This will also help users migrating a project that uses the synchronous API to become asynchronous. The team will work on a [codemod](https://github.com/webdriverio/codemod/issues/1) to help make this process as automated and easy as possible.

At this point the WebdriverIO team wants to thank Marcel Laverdet (`@laverdet` on [GitHub](https://github.com/laverdet)) for building Fibers and maintaining it for so many years. It is time to move on and embrace all the great JavaScript language feature many people have worked hard on. While we have updated the code examples in our docs, `@wdio/sync` will continue to be supported until we drop support for Node.js v14 and earlier which won't happen before April 2023. You will have enough time to slowly migrate your tests using `async/await`.

If you have any questions on this or the migration from a framework writing with synchronous commands to asynchronous code, feel free to drop us a line in our [discussion forum](https://github.com/webdriverio/webdriverio/discussions/new) or on our community [Matrix](https://matrix.to/#/#webdriver.io:gitter.im) support channel.
