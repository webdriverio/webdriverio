---
title: Avoid starting session for excluded specs
author: Mykola Grybyk
authorURL: http://github.com/mgrybyk
---

It's a common approach to filter specs with tags, grep or any other techniques, however we had a gotcha here before - a new session is created for every spec file which takes some time, especially for mobile tests.

We've added a [feature](https://github.com/webdriverio/webdriverio/pull/4531) that allows to filter spec files before a session is started. The feature is enabled by default for Cucumber framework only and is disabled by default for Mocha and Jasmine frameworks to avoid breaking changes. To use the feature, it has to be enabled in `wdio.conf.js` with feature flag, also all `browser` function calls like `browser.addCommand()` or any other have to be moved away from root scope. You can still use env flags, config or capabilities as before.

The following is only required for Mocha and Jasmine users who want to use the feature:

- Enable the feature with a flag in `wdio.conf.js`
```js
// wdio.conf.js
export.config = {
    // ...
    featureFlags: {
        specFiltering: true
    },
}
```

- Move custom commands declaration to `before` hook, if you have such, example:
```js
// wdio.conf.js
export.config = {
    // ...
    mochaOpts: {
        /**
         * all the files that interacts with `browser` object in a root scope
         * have to be required in `before` hook if `specFiltering` feature is enabled.
         */
        require: [
            "@babel/register", // if you have any transpilers leave them as is
            "./src/wdio/commands" // remove from here
        ]
    },
    before (capabilities, specs) {
        require("./src/wdio/commands") // add here
    },
}
```
- Move custom command declarations from root scope to suite level (or move them to another file and require it in `before` hook, see 2.1), if you had such, example:
```js
// my.spec.js

/**
 * move `browser.addCommand()` as well as other browser functions calls
 * from root scope to suite level (or another file)
 */
browser.addCommand('myCommand', () => {}) // remove!

// it's still possible to use config, capabilities or env flags as before.
describe('my suite in ' + browser.capabilities.browserName, () => {
    // add it to suite/test scope
    browser.addCommand('myCommand', () => {})

    it('my test', () => {
        browser.myCommand()
    })
})
```

We are happy to answer any questions and awaiting your feedback.

Please note that the feature will be enabled for all test frameworks in v6 so it's recommended to start preparation in advance.

Thanks!
