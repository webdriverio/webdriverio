---
id: debugging
title: Debugging
---

Debugging is significantly more difficult when several processes spawn dozens of tests in multiple browsers.

<iframe width="560" height="315" src="https://www.youtube.com/embed/_bw_VWn5IzU" frameborder="0" allowFullScreen></iframe>

For starters, it is extremely helpful to limit parallelism by setting `maxInstances` to `1`, and targeting only those specs and browsers that need to be debugged.

In `wdio.conf`:

```js
export const config = {
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

In many cases, you can use [`browser.debug()`](/docs/api/browser/debug) to pause your test and inspect the browser.

Your command line interface will also switch into REPL mode. This mode allows you to fiddle around with commands and elements on the page. In REPL mode, you can access the `browser` object&mdash;or `$` and `$$` functions&mdash;like you can in your tests.

When using `browser.debug()`, you will likely need to increase the timeout of the test runner to prevent the test runner from failing the test for taking to long.  For example:

In `wdio.conf`:

```js
jasmineOpts: {
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

export const config = {
    // ...
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : defaultCapabilities,
    execArgv: debug ? ['--inspect'] : [],
    jasmineOpts: {
      defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
    }
    // ...
}
```

You can then prefix the `wdio` command with the `debug` flag:

```
$ DEBUG=true npx wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

...and debug your spec file with the DevTools!

## Debugging with Visual Studio Code (VSCode)

If you want to debug your tests with breakpoints in latest VSCode, you have to install and enable the [nightly version of the JavaScript Debugger](https://marketplace.visualstudio.com/items?itemName=ms-vscode.js-debug-nightly).

> according to https://github.com/microsoft/vscode/issues/82523#issuecomment-609934308 this is only needed for windows and linux. mac os x is working without the nightly version.

Additional info: https://code.visualstudio.com/docs/nodejs/nodejs-debugging

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
    "console": "integratedTerminal",
    "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "${workspaceFolder}/lib/**/*.js",
        "<node_internals>/**/*.js"
    ]
},
```

To run all spec files remove `"--spec", "${file}"` from `"args"`

Example: [.vscode/launch.json](https://github.com/mgrybyk/webdriverio-devtools/blob/master/.vscode/launch.json)

## Dynamic Repl with Atom

If you are an [Atom](https://atom.io/) hacker you can try [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) which is a dynamic repl that allows you to execute single code lines in Atom. Watch [this](https://www.youtube.com/watch?v=kdM05ChhLQE) YouTube video to see a demo.

## Debugging with WebStorm / Intellij
You can create a node.js debug configuration like this:
![Screenshot from 2021-05-29 17-33-33](https://user-images.githubusercontent.com/18728354/120088460-81844c00-c0a5-11eb-916b-50f21c8472a8.png)
Watch this [YouTube Video](https://www.youtube.com/watch?v=Qcqnmle6Wu8) for more information about how to make a configuration.
