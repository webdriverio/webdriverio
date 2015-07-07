var q = require('q'),
    co = require('co'),
    hasES6Support = require('../helpers/detectHarmony');

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

    /**
     * enable generators if supported
     */
    if(hasES6Support) {
        mocha.suite.on('pre-require', function() {
            ['before', 'beforeEach', 'it', 'after', 'afterEach'].forEach(runInGenerator);
        });
    }

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

    q(config.before()).then(function() {
        try {
            runner = mocha.run(defer.resolve.bind(defer));
        } catch(e) {
            defer.reject({
                message: e.message,
                stack: e.stack
            });
        }

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
    }, defer.reject.bind(defer));

    return defer.promise;

};

var runInGenerator = function (fnName) {
    var origFn = global[fnName];

    var runSpec = function(specTitle, specFn) {
        return origFn.call(null, specTitle, function(done) {
            co(specFn).then(done.bind(null, null), done.bind(null));
        });
    };

    var runHook = function(specFn) {
        return origFn.call(null, function(done) {
            co(specFn).then(done.bind(null, null), done.bind(null));
        });
    };

    global[fnName] = function() {
        var args = Array.prototype.slice.call(arguments),
            specFn = typeof args[0] === 'function' ? args.shift() : args.pop(),
            specTitle = args[0];

        /**
         * if specFn is undefined we are dealing with a pending function
         */
        if(fnName === 'it' && arguments.length === 1) {
            return origFn.call(null, arguments[0]);
        }

        /**
         * only run in a generator if * is set
         */
        if(specFn.toString().slice(0, 9) !== 'function*') {
            return origFn.call(null, specTitle || specFn, specFn);
        }

        if(fnName === 'it') {
            return runSpec(specTitle, specFn);
        }

        return runHook(specFn);
    };

    if(fnName === 'it') {
        global[fnName].skip = origFn.skip;
        global[fnName].only = origFn.only;
    }
};
