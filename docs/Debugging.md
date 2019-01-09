---
id: debugging
title: Debugging
---

Debugging is significantly more difficult when there are several processes spawning dozens of tests in multiple browsers.

For starters, it is extremely helpful to limit parallelism by setting `maxInstances` to 1 and targeting only those specs and browsers that need to be debugged.


In `wdio.conf`:

```js
exports.config = {
    // ...
    maxInstances: 1,
    specs: [
        '**/myspec.spec.js'
    ],
    capabilities: [{
        browserName: 'firefox'
    }],
    // ...
}
```

## The Debug Command

In many cases, you can use [`browser.debug()`](/docs/api/browser/debug.html) to pause your test and inspect the browser. Your command line interface will also switch into a REPL mode that allows you to fiddle around with commands and elements on the page. In REPL mode you can access the browser object or `$` and `$$` functions like you can in your tests.

When using `browser.debug()` you will likely need to increase the timeout of the test runner to prevent the test runner from failing the test for taking to long.  For example:

In `wdio.conf`:

```js
jasmineNodeOpts: {
  defaultTimeoutInterval: (24 * 60 * 60 * 1000)
}
```

See [timeouts](Timeouts.md) for more information on how to do that using other frameworks.


## Debugging in Chrome DevTools

To get it working, you need to pass the `--inspect` flag down to the wdio command running tests like this:

```sh
$ wdio wdio.conf.js --inspect
```

This will start the runner process with this inspect flag enabled. With that you can open the DevTools and can connect to the runner process. Make sure you set a `debugger` statement somewhere in order to start fiddling around with commands in the console.

Tests will pause at `debugger` statements, but ONLY once dev-tools has been opened and the debugger attached. If you prefer to break on the first line, you can use `--inspect-brk` instead.

Once execution has finished, the test doesn't actually finish until the devtools is closed. You'll need to do that yourself.

## Dynamic configuration

Note that `wdio.conf.js` can contain javascript. Since you probably do not want to permanently change your timeout value to 1 day, it can be often helpful to change these settings from the command line using an environment variable. This can used to dynamically change the configuration:

```js
const debug = process.env.DEBUG;
const defaultCapabilities = ...;
const defaultTimeoutInterval = ...;
const defaultSpecs = ...;

exports.config = {
    // ...
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : defaultCapabilities,
    execArgv: debug ? ['--inspect'] : [],
    jasmineNodeOpts: {
      defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
    }
    // ...
}
```

You can then prefix the `wdio` command with the debug flag:

```
DEBUG=true ./node_modules/.bin/wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

and debug your spec file with the DevTools.

## Dynamic Repl with Atom

If you are an [Atom](https://atom.io/) hacker you can try [wdio-repl](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) which is a dynamic repl that allows you to execute single code lines in Atom. Watch [this](https://www.youtube.com/watch?v=kdM05ChhLQE) Youtube video to see a demo.
