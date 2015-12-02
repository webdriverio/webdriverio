var q = require('q'),
    co = require('co'),
    path = require('path'),
    util = require('util'),
    EOL = require('os').EOL,
    isGeneratorFn = require('is-generator').fn,
    hasES6Support = require('../helpers/detectHarmony');

/**
 * QUnit runner
 */
module.exports.run = function(config, specs, capabilities) {
    var defer = q.defer();

    function sendMessage(evt, suiteName, title, duration, error) {
        var message = {
            event: evt,
            pid: process.pid,
            title: title || suiteName,
            pending: false,
            parent: evt.indexOf('test') >= 0 ? suiteName : null,
            type: evt.indexOf('test') >= 0 ? 'test' : 'suite',
            file: undefined,
            err: error || {},
            duration: duration,
            runner: {}
        }; message.runner[process.pid] = capabilities;
        process.send(message);
    };

    // setup QUnit
    var QUnit = GLOBAL.QUnit = require('qunitjs');
    QUnit.config.autorun = false;
    QUnit.config.autostart = false;
    if (hasES6Support)
        ['test', 'asyncTest', 'only', 'skip'].forEach(runInGenerator.bind(null, QUnit));
    setupMessageCallbacks(QUnit, sendMessage);

    q(config.before()).then(function() {
        try {
            // run QUnit tests
            specs.forEach(require);

            // start & end QUnit
            QUnit.done(function(details) {
                defer.resolve.call(defer, details.failed);
            });
            QUnit.load();
            QUnit.start();
        } catch(e) {
            defer.reject({
                message: e.message,
                stack: e.stack
            });
        }
    }, defer.reject.bind(defer));

    return defer.promise;
};



function setupMessageCallbacks(QUnit, sendMessage) {
    var suiteName = 'Default module',
        error = undefined;


    QUnit.moduleStart(function(details) {
        suiteName = details.name;

        sendMessage('suite:start', details.name, '', 0, undefined);
    });


    QUnit.testStart(function(details) {
        error = undefined;

        var testName = (details.module || suiteName) + ' - ' + (details.name || 'Unnamed test');
        sendMessage('test:start', suiteName, testName, 0, error);
    });

    QUnit.log(function(details) {
        if (!details.result && !error) {
            var msg = 'Actual value ' + util.inspect(details.actual) + ' does not match expected value ' + util.inspect(details.expected) + '.';
            error = {
                message: 'Description: ' + details.message + EOL + 'Reason: ' + msg,
                stack: details.source
            };
        }
    });

    QUnit.testDone(function(details) {
        var testName = (details.module || suiteName) + ' - ' + (details.name || 'Unnamed test');

        sendMessage('test:end', suiteName, testName, details.runtime, error);
        if (details.skipped)
            sendMessage('test:pending', suiteName, testName, details.runtime, error);
        else if (details.failed > 0)
            sendMessage('test:fail', suiteName, testName, details.runtime, error);
        else if (details.passed === details.total)
            sendMessage('test:pass', suiteName, testName, details.runtime, error);
    });


    QUnit.moduleDone(function(details) {
        sendMessage('suite:end', details.name, '', details.runtime, undefined);
    });
}

//TODO wrap module.beforeEach and module.afterEach in generators
var runInGenerator = function (QUnit, fnName) {
    var origFn = QUnit[fnName];

    QUnit[fnName] = function() {
        var testName = arguments[0],
            expected = arguments[1],
            callback = arguments[2],
            isAsync = arguments[3];

        if (arguments.length === 2) {
            callback = expected;
            expected = null;
        }

        /**
         * only run in a generator if * is set
         */
        if (!isGeneratorFn(callback)) {
            return origFn.call(null, testName, expected, callback, isAsync);
        } else {
            return origFn.call(null, testName, expected, co.wrap(callback), isAsync);
        }
    };
};
