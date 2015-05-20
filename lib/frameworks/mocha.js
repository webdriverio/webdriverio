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
