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

    /**
     * ToDo implement onPrepare
     */

    specs.forEach(function(spec) {
        mocha.addFile(spec);
    });

    config.desiredCapabilities = capabilities;
    global.browser = WebdriverIO.remote(config).init().then(function() {
        runner = mocha.run(defer.resolve.bind(defer));
        var events = ['start', 'end', 'suite', 'suite end', 'test', 'test end', 'hook', 'hook end', 'pass', 'fail', 'pending'];
        events.forEach(function(e) {
            runner.on(e, emit(e));
        });
    });

    defer.promise.then(function(failures) {
        return global.browser.end().then(function() {
            process.send({
                event: 'process:end',
                failures: failures
            });

            process.exit(0);
        }, function() {
            process.exit(1);
        });
    });


    /**
     * ToDo register listeners
     */

};

function emit(e) {
    return function() {
        process.send({
            event: e,
        });
    };
}