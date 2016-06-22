name: Debugging
category: testrunner
tags: guide
index: 8
title: WebdriverIO - Test Runner Frameworks
---

Debugging
==========

Debugging is significantly more difficult when there are several of processes spawning dozens of tests in multiple browsers.

For starters, it is extremely helpful to limit parallelism by setting `maxInstances` to 1 and targeting only those specs and browsers that need to be debugged.


In `wdio.conf`:
```
maxInstances: 1,
specs: ['**/myspec.spec.js'],
capabilities: [{browserName: 'firefox'}]
```

In many cases, you can use `browser.debug()` to pause your test and inspect the browser.
When using `browser.debug()` you will likely need to increase the timeout of the test runner to prevent the test runner from failing the test for taking to long.  For example:

In `wdio.conf`:
```
jasmineNodeOpts: {
  defaultTimeoutInterval: (24 * 60 * 60 * 1000);
}
```

## Node Inspector

For a more comprehensive debugging experience you can enable debug flag to start the test runner processes with an open debugger port.  

This will allow attaching the node-inspector and pausing test execution with `debugger`.  Each child process will be assigned a new debugging port starting at `5859`.

This feature can be enabled by enabling the `debug` flag in wdio.conf:

```
{
  debug: true
}
```

Once enabled tests will pause at `debugger` statements. You then must attach the debugger to continue.

If you do not already have `node-inspector` installed, install it with:
```
npm install -g node-inspector
```

And attach to the process with:
```
node-inspector --debug-port 5859 --no-preload
```

The `no-preload` option defers loading source file until needed, this helps performance significantly when project contains a large number of node_modules, but you may need to remove this if you need to navigate your source and add additional breakpoints after attaching the debugger.  

## Dynamic configuration


Note that `wdio.conf` can contain javascript. Since you probably do not want to permanently change your timeout value to 1 day, it can be often helpful to change these settings from the command line using an environment variable. This can used to dynamically change the configuration:

```
var debug = process.env.DEBUG;
var defaultCapabilities = ...;
var defaultTimeoutInterval = ...;
var defaultSpecs = ...;


exports.config = {
debug: debug,
maxInstances: debug ? 1 : 100,
capabilities: debug ? [{browserName: 'chrome'}] : defaultCapabilities,
specs:  process.env.SPEC ? [process.env.SPEC] : defaultSepcs,
jasmineNodeOpts: {
  defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
}

```

You can then prefix the `wdio` command with your desired values:
```
DEBUG=true SPEC=myspec ./node_modules/.bin/wdio wdio.conf
```
