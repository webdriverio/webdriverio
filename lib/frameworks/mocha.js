var WebdriverIO = require('../../'),
    q = require('q');

/**
 * Mocha runner
 */
module.exports.run = function(config, specs, capabilities) {
    var Mocha = require('mocha'),
        mocha = new Mocha(config.mochaOpts),
        defer = q.defer(),
        runner;

    mocha.loadFiles();
    mocha.reporter(function(){});

    /**
     * ToDo implement onPrepare
     */

    specs.forEach(function(spec) {
        mocha.addFile(spec);
    });

    config.desiredCapabilities = capabilities;
    global.browser = WebdriverIO.remote(config).init().then(function() {
        runner = mocha.run(defer.resolve.bind(defer));
        var events = {
            'suite': 'suite:start',
            'suite end': 'suite:end',
            'test': 'test:start',
            'test end': 'test:end',
            'hook': 'hook:start',
            'hook end': 'hook:end',
            'pass': 'test:pass',
            'fail': 'test:fail',
            'pending': 'test:pending'
        };

        /**
         * register runner events
         */

        global.browser.on('init', function(payload) {
            process.send({
                event: 'runner:init',
                pid: process.pid,
                sessionID: payload.sessionID,
                options: payload.options,
                desiredCapabilities: payload.desiredCapabilities
            });
        });

        global.browser.on('command', function(payload) {
            process.send({
                event: 'runner:command',
                pid: process.pid,
                method: payload.method,
                uri: payload.uri,
                data: payload.data
            });
        });

        global.browser.on('result', function(payload) {
            process.send({
                event: 'runner:result',
                pid: process.pid,
                requestData: payload.requestData,
                requestOptions: payload.requestOptions,
                body: payload.body // ToDo figure out if this slows down the execution time
            });
        });

        global.browser.on('end', function(payload) {
            process.send({
                event: 'runner:end',
                pid: process.pid,
                sessionId: payload.sessionId
            });
        });

        global.browser.on('error', function(payload) {
            process.send({
                event: 'runner:error',
                pid: process.pid,
                err: payload.err,
                requestData: payload.requestData,
                requestOptions: payload.requestOptions,
                body: payload.body
            });
        });

        Object.keys(events).forEach(function(e) {
            runner.on(e, function(payload, err) {
                var error = null;

                if(err) {
                    error = {
                        message: err.message,
                        stack: err.stack,
                    };
                }

                var message = {
                    event: events[e],
                    pid: process.pid,
                    title: payload.title,
                    pending: payload.pending || false,
                    parent: payload.parent ? payload.parent.title : null,
                    type: payload.tests ? 'suite' : 'test',
                    file: payload.file,
                    err: error,
                    duration: payload.duration,
                    runner: {}
                };

                message.runner[process.pid] = capabilities;
                process.send(message);
            });
        });
    });

    defer.promise.then(function(failures) {
        return global.browser.end().then(function() {
            process.send({
                event: 'runner:end',
                failures: failures,
                pid: process.pid
            });

            process.exit(0);
        }, function() {
            process.exit(1);
        });
    });

};
