name: customreporter
category: reporters
tags: guide
index: 5
title: WebdriverIO - Custom Reporter
---

Custom Reporter
===============

You can write your own custom reporter for the wdio test runner that fits your needs. All you need to do is to create a node module that inherits from the Eventemitter object so it can receive messages from the test. The basic construction should look like:

```js
var util = require('util'),
    events = require('events');

var CustomReporter = function(options) {
    // you can access reporter options via
    // `options.reporterOptions`
    // ...
};

/**
 * Inherit from EventEmitter
 */
util.inherits(CustomReporter, events.EventEmitter);

/**
 * Expose Custom Reporter
 */
exports = module.exports = CustomReporter;
```

The only thing to do now in order to use this reporter is to assign it to the reporter property. Therefor
your wdio.conf.js file should look like this:

```js
var CustomReporter = require('./reporter/my.custom.reporter');

exports.config = {
    // ...
    reporters: [CustomReporter],
    // ...
};
```

## Events

You can register event handler for several events which get triggered during the test. All these handlers will receive payloads with useful information about the current state and progress. The structure of  these payload objects depend on the event and are unified across the frameworks (Mocha, Jasmine and Cucumber). Once you implemented your custom reporter it should work for all frameworks. The following list contains all possible events you can register an event handler on:

```txt
'start'
'suite:start'
'hook:start'
'hook:end'
'test:start'
'test:end'
'test:pass'
'test:fail'
'test:pending'
'suite:end'
'end'
```

The event names are pretty self explanatory. To print something on a certain event, just register an event handler using the utility functions from node's [EventEmitter](https://nodejs.org/api/events.html):

```js
this.on('test:pass', function() {
    console.log('Hurray! A test has passed!');
});
```

Note that you can't defer the test execution in any way. All event handler should execute synchronous routines otherwise you will run into race conditions. Make sure you check out the [example section](https://github.com/webdriverio/webdriverio/tree/master/examples/wdio) where you can find an example for a custom reporter that prints the event name for each event. If you have implemented a custom reporter that can be useful for the community, don't hesitate to make a Pull Request so we can make the reporter available for the public.
