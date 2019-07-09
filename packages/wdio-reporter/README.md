WebdriverIO Reporter
====================

> A WebdriverIO utility to help reporting all events

The `@wdio/reporter` package can be used to create own custom reporter and publish them to NPM. They have to follow a specific convention as described below in order to work properly. First you need to add `@wdio/reporter` as dependency of your custom reporter:

```sh
npm install @wdio/reporter
```

or

```sh
yarn add @wdio/reporter
```

Then you need to extend your reporter with the main `@wdio/reporter` class:

```js
import Reporter from '@wdio/reporter'

export default MyCustomeReporter extends Reporter {
    constructor () {
        super()
        // your custom logic if necessary
        // ...
    }

    onRunnerStart () {
        // ...
    }

    onSuiteStart (suite) {
        // ...
    }

    // ...
}
```

The `Reporter` parent class calls your event functions if provided when an event was triggered and provides information on that event in a consistent format. You can always register your own listener to receive the raw data that was provided by the framework, e.g. instead of using the `onSuiteStart` method you can do:

```js
this.on('suite:start', (raw) => {
    // ...
})
```

in your constructor function.

## Configuration

User can pass in custom configurations for each reporter. Per default WebdriverIO populates the `outputDir` and `logLevel` option to the reporter, they can get overwritten too. For example, if the user has provided the following reporter options:

```js
// wdio.conf.js
exports.config = {
    // ...
    reporters: ['dot', ['my-reporter', {
        outputDir: '/some/path',
        foo: 'bar'
    }]]
    // ...
}
```

your options in your reporter class are as follows:

```js
export default class MyReporter extends Reporter {
    constructor () {
        super()
        console.log(this.options)
        /**
         * outputs:
         * {
         *   outputDir: '/some/path',
         *   logLevel: 'trace',
         *   foo: 'bar'
         * }
         */
    }
}
```

You can access all options via `this.options`. You can push logs to stdout or a log file depending of whether the `stdout` option is true or false. Please use the internal method `write` that is provided by the `Reporter` parent class in order to push out logs, e.g.

```js
class MyReporter extends Reporter {
    constructor (options) {
        /**
         * make dot reporter to write to output stream by default
         */
        options = Object.assign(options, { stdout: true })
        super(options)
    }

    // ...
    onTestPass (test) {
        this.write(`test "${test.title}" passed`)
    }
    // ...
}
```

This will result the following output:

```
"MyReporter" Reporter:
test "some test" passed
test "some other test" passed

"spec" Reporter:
...
```

If `stdout` is set to `false` WebdriverIO will automatically write to a filestream at a location where other logs are stored as well.

## Synchronization

If your reporter needs to do some async computation after the test (e.g. upload logs to a server) you can overwrite the `isSynchronised` getter method to manage this. By default this property always returns true as most of the reporters don't require to do any async work. However in case you need to handle this overwrite the getter method with an custom implementation (e.g. [wdio-sumologic-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sumologic-reporter)).

```js
class MyReporter extends Reporter {
    constructor (options) {
        // ...
    }

    get isSynchronised (test) {
        return this.unsyncedMessages.length === 0
    }

    // ...
}
```

The wdio testrunner will wait to kill the runner process until every reporter has the `isSynchronised` property set to `true`.

## Events

During a test run in WebdriverIO several events are thrown and can be captured by your event functions. The following events are propagated:

### Test Events

These events are containing data about the test regardless of the framework it is running in.

##### onSuiteStart

```js
SuiteStats {
  type: 'suite',
  start: '2018-02-09T13:30:40.177Z',
  duration: 0,
  uid: 'root suite2',
  cid: '0-0',
  title: 'root suite',
  fullTitle: 'root suite',
  tests: [],
  hooks: [],
  suites: [] } }
```

##### onSuiteEnd

```js
SuiteStats {
  type: 'suite',
  start: '2018-02-09T13:30:40.177Z',
  duration: 1432,
  uid: 'root suite2',
  cid: '0-0',
  title: 'root suite',
  fullTitle: 'root suite',
  tests: [ [TestStats] ],
  hooks: [ [HookStats], [HookStats] ],
  suites: [ [Object] ],
  end: '2018-02-09T13:30:41.609Z' } }
```

##### onHookStart

```js
HookStats {
  type: 'hook',
  start: '2018-02-09T13:30:40.181Z',
  duration: 0,
  uid: '"before each" hook4',
  cid: '0-0',
  title: '"before each" hook',
  parent: 'root suite',
```

##### onHookEnd

```js
HookStats {
  type: 'hook',
  start: '2018-02-09T13:30:40.181Z',
  duration: 1,
  uid: '"before each" hook4',
  cid: '0-0',
  title: '"before each" hook',
  parent: 'root suite',
  end: '2018-02-09T13:30:40.182Z' } }
```

##### onTestStart

```js
TestStats {
  type: 'test',
  start: '2018-02-09T13:30:40.180Z',
  duration: 0,
  uid: 'passing test3',
  cid: '0-0',
  title: 'passing test',
  fullTitle: 'passing test',
  state: 'pending' } }
```

Cucumber tests come with an additional `argument` property containing data tables if used in feature files, e.g.:

```js
TestStats {
  type: 'test',
  start: '2019-07-08T08:44:56.666Z',
  duration: 0,
  uid: 'I add the following grocieries16',
  cid: '0-0',
  title: 'I add the following grocieries',
  output: [],
  argument: [{
    rows: [{
      cells: ['Item', 'Amount'],
      locations: [{
        line: 17,
        column: 11
      }, {
        line: 17,
        column: 24
      }]
    }, {
      cells: ['Milk', '2'],
      locations: [{
        line: 18,
        column: 11
      }, {
        line: 18,
        column: 24
      }]
    }, {
      cells: ['Butter', '1'],
      locations: [{
        line: 19,
        column: 11
      }, {
        line: 19,
        column: 24
      }]
    }, {
        cells: ['Noodles', '1'],
      locations: [{
        line: 20,
        column: 11
      }, {
        line: 20,
        column: 24
      }]
    }, {
      cells: ['Schocolate', '3'],
      locations: [{
        line: 21,
        column: 11
      }, {
        line: 21,
        column: 24
      }]
    }]
  }],
  state: 'pending'
}
```

##### onTestSkip

```js
TestStats {
  type: 'test',
  start: '2018-02-09T14:01:04.573Z',
  duration: 0,
  uid: 'skipped test6',
  cid: '0-0',
  title: 'skipped test',
  fullTitle: 'skipped test',
  state: 'skipped' }
```

##### onTestPass

```js
TestStats {
  type: 'test',
  start: '2018-02-09T14:11:28.075Z',
  duration: 1503,
  uid: 'passing test3',
  cid: '0-0',
  title: 'passing test',
  fullTitle: 'passing test',
  state: 'passed',
  end: '2018-02-09T14:11:29.578Z' } }
```

##### onTestFail

```js
TestStats {
     type: 'test',
     start: '2018-02-09T14:11:29.581Z',
     duration: 21,
     uid: 'failing test8',
     cid: '0-0',
     title: 'failing test',
     fullTitle: 'failing test',
     state: 'failed',
     end: '2018-02-09T14:11:29.602Z',
     error:
      { message: 'some error',
        stack: `Error: some error\n    at Context.it (/path/to/project/test/b.js:17:19)\n
  at /path/to/project/packages/wdio-sync/src/index.js:490:28\n    at Promise (<anonymous>)\
n    at F (/path/to/project/node_modules/core-js/library/modules/_export.js:35:28)\n    at
Context.executeSync (/path/to/project/packages/wdio-sync/src/index.js:488:12)\n    at /path/to/project/packages/wdio-sync/src/index.js:623:33`,
        type: 'Error' } } }
```

##### onTestEnd

```js
TestStats {
  type: 'test',
  start: '2018-02-09T14:11:28.075Z',
  duration: 1503,
  uid: 'passing test3',
  cid: '0-0',
  title: 'passing test',
  fullTitle: 'passing test',
  state: 'passed',
  end: '2018-02-09T14:11:29.578Z' } }
```

### Runner Events

These events contain information on the test runner.

##### onRunnerStart

```js
RunnerStats {
  type: 'runner',
  start: '2018-02-09T14:30:19.871Z',
  duration: 0,
  cid: '0-0',
  capabilities:
   { acceptInsecureCerts: false,
     browserName: 'firefox',
     browserVersion: '59.0',
     'moz:accessibilityChecks': false,
     'moz:headless': false,
     'moz:processID': 92113,
     'moz:profile': '/var/folders/ns/8mj2mh0x27b_gsdddy1knnsm0000gn/T/rust_mozprofile.jlpfs632Becb',
     'moz:webdriverClick': true,
     pageLoadStrategy: 'normal',
     platformName: 'darwin',
     platformVersion: '17.3.0',
     rotatable: false,
     timeouts: { implicit: 0, pageLoad: 300000, script: 30000 } },
  sanitizedCapabilities: 'firefox.59_0.darwin',
  config: [Object],
  specs: [ '/path/to/project/test/my.test.js' ] },
  retry: 0
```

##### onRunnerEnd

```js
RunnerStats {
  type: 'runner',
  start: '2018-02-09T14:30:19.871Z',
  duration: 1546,
  uid: undefined,
  cid: '0-0',
  capabilities: [Object],
  sanitizedCapabilities: 'firefox.59_0.darwin',
  config: [Object],
  specs: [ '/path/to/project/test/my.test.js' ],
  failures: 1,
  retries: 1,
  end: '2018-02-09T14:30:21.417Z' } }
```

### Client Events

Client events are triggered when certain interactions with the automation driver are happening.

##### onBeforeCommand

```js
{ method: 'GET',
  endpoint: '/session/:sessionId/element',
  body: { using: 'css selector', value: 'img' }
  cid: '0-0',
  sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
  capabilities: [Object] }
```

##### onAfterCommand

```js
{ method: 'GET',
  endpoint: '/session/:sessionId/element/fbf57b79-6521-7d49-b3b7-df91cf2c347a/rect',
  body: {},
  result: { value: { x: 75, y: 11, width: 160, height: 160 } },
  cid: '0-0',
  sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
  capabilities: [Object] }
```
