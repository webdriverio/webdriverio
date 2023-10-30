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

See [timeouts](timeouts) for more information on how to do that using other frameworks.

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

If you want to debug your tests with breakpoints in latest VSCode, you have two options for starting the debugger of which option 1 is the easiest method:
 1. automatically attaching the debugger
 2. attaching the debugger using a configuration file

### VSCode Toggle Auto Attach

You can automatically attach the debugger by following these steps in VSCode:
 - Press CMD + Shift + P (Linux and Macos) or CTRL + Shift + P (Windows)
 - Type "attach" into the input field
 - Select "Debug: Toggle Auto Attach"
 - Select "Only With Flag"

 That's it! Now when you run your tests (remember you will need the --inspect flag set in your config as shown earlier) it will automatically start the debugger and stop on the first breakpoint that it reaches.

### VSCode Configuration file

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

Additional info: https://code.visualstudio.com/docs/nodejs/nodejs-debugging

## Dynamic Repl with Atom

If you are an [Atom](https://atom.io/) hacker you can try [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) which is a dynamic repl that allows you to execute single code lines in Atom. Watch [this](https://www.youtube.com/watch?v=kdM05ChhLQE) YouTube video to see a demo.

## Debugging with WebStorm / Intellij
You can create a node.js debug configuration like this:
![Screenshot from 2021-05-29 17-33-33](https://user-images.githubusercontent.com/18728354/120088460-81844c00-c0a5-11eb-916b-50f21c8472a8.png)
Watch this [YouTube Video](https://www.youtube.com/watch?v=Qcqnmle6Wu8) for more information about how to make a configuration.

## Debugging flaky tests


### Network
Flaky tests can be really hard to debug so here are some tips how you can try and get that flaky result you got in your CI, reproduced locally.
To debug network related flakiness use the [throttleNetwork](https://webdriver.io/docs/api/browser/throttleNetwork) command.
```js
await browser.throttleNetwork('Regular3G')
```

### Rendering speed
To debug device speed related flakiness use the [throttleCPU](https://webdriver.io/docs/api/browser/throttleCPU) command.
This will cause your pages to render slower which can be caused by many things like running multiple processes in your CI which could be slowing down your tests.
```js
await browser.throttleCPU(4)
```

### Test execution speed
If your tests do not seem to be affected it is possible that WebdriverIO is faster than the update from the frontend framework / browser.
This happens when using synchronous assertions, some examples of code that can break because of this:
```js
expect(elementList.length).toEqual(7) // list might not be populated at the time of the assertion
expect(await elem.getText()).toEqual('this button was clicked 3 times') // text might not be updated yet at the time of assertion resulting in an error ("this button was clicked 2 times" does not match the expected "this button was clicked 3 times")
expect(await elem.isDisplayed()).toBe(true) // might not be displayed yet
```
To resolve this problem, asynchronous assertions should be used instead. The above examples would looks like this:
```js
await expect(elementList).toBeElementsArrayOfSize(7)
await expect(elem).toHaveText('this button was clicked 3 times')
await expect(elem).toBeDisplayed()
```
Using these assertions, WebdriverIO will automatically wait until the condition matches. When asserting text this means that the element needs to exist and the text needs to be equal to the expected value.
We talk more about this in our [Best Practices Guide](https://webdriver.io/docs/bestpractices#use-the-built-in-assertions).