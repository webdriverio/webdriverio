---
id: debugging
title: Debugging
---

Debugging is significantly more difficult when several processes spawn dozens of tests in multiple browsers.

For starters, it is extremely helpful to limit parallelism by setting `maxInstances` to `1`, and targeting only those specs and browsers that need to be debugged.


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

In many cases, you can use [`browser.debug()`](/docs/api/browser/debug.html) to pause your test and inspect the browser.

Your command line interface will also switch into REPL mode. This mode allows you to fiddle around with commands and elements on the page. In REPL mode, you can access the `browser` object&mdash;or `$` and `$$` functions&mdash;just like you can in your tests.

When using `browser.debug()`, you will likely need to increase the timeout of the test runner to prevent the test runner from failing the test for taking to long.  For example:

In `wdio.conf`:

```js
jasmineNodeOpts: {
  defaultTimeoutInterval: (24 * 60 * 60 * 1000)
}
```

See [timeouts](Timeouts.md) for more information on how to do that using other frameworks.

To proceed with the tests after debugging, in the shell use `^C` shortcut or the `.exit` command.
## Dynamic configuration

Note that `wdio.conf.js` can contain Javascript. Since you probably do not want to permanently change your timeout value to 1 day, it can be often helpful to change these settings from the command line using an environment variable.

Using this technique, you can dynamically change the configuration:

```js
const debug = process.env.DEBUG
const defaultCapabilities = ...
const defaultTimeoutInterval = ...
const defaultSpecs = ...

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

You can then prefix the `wdio` command with the `debug` flag:

```
DEBUG=true ./node_modules/.bin/wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

...and debug your spec file with the DevTools!

## Debugging with Visual Studio Code (VSCode)

It's possible to run all or selected spec file(s). Debug configuration(s) have to be added to `.vscode/launch.json`, to debug selected spec add the following config:
```
{
    "name": "run select spec",
    "type": "node",
    "request": "launch",
    "args": ["wdio.conf.js", "--spec", "${file}"],
    "cwd": "${workspaceFolder}",
    "autoAttachChildProcesses": true,
    "program": "${workspaceRoot}/node_modules/@wdio/cli/bin/wdio.js",
    "console": "integratedTerminal"
},
```

To run all spec files remove `"--spec", "${file}"` from `"args"`

Example: [.vscode/launch.json](https://github.com/mgrybyk/webdriverio-devtools/blob/master/.vscode/launch.json)

## Dynamic Repl with Atom

If you are an [Atom](https://atom.io/) hacker you can try [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) which is a dynamic repl that allows you to execute single code lines in Atom. Watch [this](https://www.youtube.com/watch?v=kdM05ChhLQE) YouTube video to see a demo.
