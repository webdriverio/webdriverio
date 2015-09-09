var util = require('util'),
    events = require('events');

var CustomReporter = function(options) {
    console.log('initialised custom reporter with the following reporter options:', options.reporterOptions);

    this.on('start', function() {
        console.log('start');
    });

    this.on('end', function() {
        console.log('end');
    });

    this.on('suite:start', function() {
        console.log('suite:start');
    });

    this.on('suite:end', function() {
        console.log('suite:end');
    });

    this.on('test:start', function() {
        console.log('test:start');
    });

    this.on('test:end', function() {
        console.log('test:end');
    });

    this.on('hook:start', function() {
        console.log('hook:start');
    });

    this.on('hook:end', function() {
        console.log('hook:end');
    });

    this.on('test:pass', function() {
        console.log('test:pass');
    });

    this.on('test:fail', function() {
        console.log('test:fail');
    });

    this.on('test:pending', function() {
        console.log('test:pending');
    });
};

/**
 * Inherit from EventEmitter
 */
util.inherits(CustomReporter, events.EventEmitter);

/**
 * Expose Custom Reporter
 */
exports = module.exports = CustomReporter;