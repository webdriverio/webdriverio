---
id: watcher
title: Watch Test Files
---

With the WDIO testrunner you can watch files while you are working on them. They automatically rerun if you change either something in your app or in your test files. By adding a `--watch` flag when calling the `wdio` command the testrunner will wait for file changes after it ran all tests, e.g.

```sh
wdio wdio.conf.js --watch
```

By default it only watches for changes in your `specs` files. However by setting a `filesToWatch` property in your `wdio.conf.js` that contains a list of file paths (globbing supported) it will also watch for these files to be changed in order to rerun the whole suite. This is useful if you want to automatically rerun all your tests if you have changed your application code, e.g.

```js
// wdio.conf.js
export const config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

:::info
Try to run tests in parallel as much as possible. E2E tests are, by nature, slow. Rerunning tests is only useful if you can keep the individual test run time short. In order to save time, the testrunner keeps WebDriver sessions alive while waiting for file changes. Make sure your WebDriver backend can be modified so that it doesn't automatically close the session if no command was executed after some duration of time.
:::
