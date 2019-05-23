---
id: customreporter
title: Reporte personalizado
---

Puede escribir su propio reportero personalizado para el gestor de pruebas de wdio que se adapte a sus necesidades. All you need to do is to create a node module that inherits from the `@wdio/reporter` package so it can receive messages from the test. The basic construction should look like:

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    constructor (options) {
        /**
         * make reporter to write to output stream by default
         */
        options = Object.assign(options, { stdout: true });
        super(options);
    }

    onTestPass (test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`);
    }
};
```

The only thing to do now in order to use this reporter is to assign it to the reporter property. Therefor your wdio.conf.js file should look like this:

```js
var CustomReporter = require('./reporter/my.custom.reporter');

exports.config = {
    // ...
    reporters: [[CustomReporter, {
        someOption: 'foobar'
    }]],
    // ...
};
```

You can also publish the reporter to NPM so everyone can use it. Name the package like other reporters `wdio-<reportername>-reporter` and tag it with keywords like `wdio` or `wdio-reporter`.

## Event Handler

You can register event handler for several events which get triggered during the test. All these handlers will receive payloads with useful information about the current state and progress. The structure of these payload objects depend on the event and are unified across the frameworks (Mocha, Jasmine and Cucumber). Once you implemented your custom reporter it should work for all frameworks. The following list contains all possible methods you can add to your reporter class:

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    onRunnerStart () {}
    onBeforeCommand () {}
    onAfterCommand () {}
    onScreenshot () {}
    onSuiteStart () {}
    onHookStart () {}
    onHookEnd () {}
    onTestStart () {}
    onTestPass () {}
    onTestFail () {}
    onTestSkip () {}
    onTestEnd () {}
    onSuiteEnd () {}
    onRunnerEnd () {}
};
```

The method names are pretty self explanatory. To print something on a certain event, use the `this.write(...)` method which is provided by the parent class (`WDIOReporter`). It either streams the content to stdout or to a log file depending on the options of the reporter.

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    onTestPass (test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`);
    }
};
```

Note that you can't defer the test execution in any way. All event handler should execute synchronous routines otherwise you will run into race conditions. Make sure you check out the [example section](https://github.com/webdriverio/webdriverio/tree/master/examples/wdio) where you can find an example for a custom reporter that prints the event name for each event. If you have implemented a custom reporter that can be useful for the community, don't hesitate to make a Pull Request so we can make the reporter available for the public.