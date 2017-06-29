name: Debugging
category: testrunner
tags: guide
index: 8
title: WebdriverIO - Test Runner Frameworks
---

Debugging
==========

Debugging is significantly more difficult when there are several processes spawning dozens of tests in multiple browsers.

For starters, it is extremely helpful to limit parallelism by setting `maxInstances` to 1 and targeting only those specs and browsers that need to be debugged.


In `wdio.conf`:
```
maxInstances: 1,
specs: ['**/myspec.spec.js'],
capabilities: [{browserName: 'firefox'}]
```

In many cases, you can use [`browser.debug()`](/api/utility/debug.html) to pause your test and inspect the browser. Your command line interface will also switch into a REPL mode that allows you to fiddle around with commands and elements on the page. In REPL mode you can access the browser object or `$` and `$$` functions like you can in your tests.

When using `browser.debug()` you will likely need to increase the timeout of the test runner to prevent the test runner from failing the test for taking to long.  For example:

In `wdio.conf`:
```
jasmineNodeOpts: {
  defaultTimeoutInterval: (24 * 60 * 60 * 1000);
}
```

See [timeouts](/guide/testrunner/timeouts.html) for more information on how to do that using other frameworks.

## Watch files

With `v4.6.0` WebdriverIO introduced a watch argument that can help you to run certain specs when they get updated. To enable it just run the wdio command with the watch flag like:

```sh
wdio wdio.conf.js --watch
```

It will initialize the desired Selenium sessions defined in your config and will wait until a file that was defined via the `specs` option has changed. This works regardless you run your tests on a local grid or on cloud services like [SauceLabs](https://saucelabs.com/).

## Node Inspector

**n.b. If you are using Node v6.3 and above, you should use Node's built-in debugger, instead. [See below](#node_debugger)**

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

## Node built-in debugging with chrome-devtools<a id="node_debugger"></a>

Chrome devtool debugging looks like it's going to be the accepted replacement for node-inspector. This quote is from the node-inspector github README:

> Since version 6.3, Node.js provides a buit-in DevTools-based debugger which mostly deprecates Node Inspector, see e.g. this blog post to get started. The built-in debugger is developed directly by the V8/Chromium team and provides certain advanced features (e.g. long/async stack traces) that are too difficult to implement in Node Inspector.

To get it working, you need to pass the `--inspect` flag down to the node process running tests like this:

In `wdio.conf`:
```
execArgv: ['--inspect']
```

You should see a message something like this in console:
```
Debugger listening on port 9229.
Warning: This is an experimental feature and could change at any time.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/remote/serve_file/@60cd6e859b9f557d2312f5bf532...
```
You'll want to open that url, which will attach the debugger.

Tests will pause at `debugger` statements, but ONLY once dev-tools has been opened and the debugger attached. That can be a little awkward if you're trying to debug something close to the start of a test. You can get around that by adding a `browser.debug()` to pause long enough.

Once execution has finished, the test doesn't actually finish until the devtools is closed. You'll need to do that yourself.

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

## Dynamic Repl with Atom

If you are an [Atom](https://atom.io/) hacker you can try [wdio-repl](https://github.com/kurtharriger/wdio-repl) by [@kurtharriger](https://github.com/kurtharriger) which is a dynamic repl that allows you to execute single code lines in Atom. Watch [this](https://www.youtube.com/watch?v=kdM05ChhLQE) Youtube video to see a demo.
