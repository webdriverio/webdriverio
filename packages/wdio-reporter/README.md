WebdriverIO Reporter
====================

> A WebdriverIO utility to help reporting all events

The `wdio-reporter` package can be used to create own custom reporter and publish them to NPM. They have to follow a specific convention as described below in order to work properly. First you need to add `wdio-reporter` as dependency of your custom reporter:

```sh
npm install wdio-reporter
```

or

```sh
yarn add wdio-reporter
```

Then you need to extend your reporter with the main wdio-reporter class:

```js
import WDIOReporter from 'wdio-reporter'

export default MyCustomeReporter extends WDIOReporter {
    constructor () {
        super()
        // your custom logic if necessary
        // ...
    }

    onStart () {
        // ...
    }

    onSuiteStart (suite) {
        // ...
    }

    // ...
}
```

The WDIOReporter calls your event functions if provided when an event was triggered and provides information on that event in a consistent format. You can always register your own listener to receive the raw data that was provided by the framework, e.g. instead of using the `onSuiteStart` method you can do:

```js
this.on('suite:start', (raw) => {
    // ...
})
```

in your constructor function.

## Events

During a test run in WebdriverIO several events are thrown and can be captured by your event functions. The following events are propagated:

### Test Events

These events are containing data about the test regardless of the framework it is running in.

##### onSuiteStart

```js
{}
```

##### onSuiteEnd

```js
{}
```

##### onHookStart

```js
{}
```

##### onHookEnd

```js
{}
```

##### onTestStart

```js
{}
```

##### onTestSkip

```js
{}
```

##### onTestPass

```js
{}
```

##### onTestFail

```js
{}
```

##### onTestEnd

```js
{}
```

### Runner Events

These events contain information on the test runner.

##### onRunnerStart

```js
{}
```

##### onRunnerEnd

```js
{}
```

### Client Events

Client events are triggered when certain interactions with the automation driver are happening.

##### onCommandStart

```js
{}
```

##### onCommandEnd

```js
{}
```
