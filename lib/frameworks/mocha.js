var q = require('q'),
    path = require('path'),
    Fiber = require('fibers'),
    interfaces = {
        bdd: ['before', 'beforeEach', 'it', 'after', 'afterEach'],
        tdd: ['suiteSetup', 'setup', 'test', 'suiteTeardown', 'teardown']
    };

/**
 * Mocha runner
 */
module.exports.run = function(cid, config, specs, capabilities) {
    var Mocha = require('mocha'),
        defer = q.defer(),
        compilers = config.mochaOpts.compilers,
        requires = config.mochaOpts.require,
        runner;

    if(typeof config.mochaOpts.ui !== 'string' || !config.mochaOpts.ui.match(/(bdd|tdd)/i)) {
        config.mochaOpts.ui = 'bdd';
    }

    var mocha = new Mocha(config.mochaOpts);
    mocha.loadFiles();
    mocha.reporter(function(){});

    compilers = Array.isArray(compilers) ? compilers : [];
    requires = Array.isArray(requires) ? requires : [];
    compilers.concat(requires).forEach(function(mod) {
        mod = mod.split(':');
        mod = mod[mod.length - 1];

        if (mod[0] === '.') {
            mod = path.join(process.cwd(), mod);
        }

        require(mod);
    });

    specs.forEach(function(spec) {
        mocha.addFile(spec);
    });

    mocha.suite.on('pre-require', function() {
        interfaces[config.mochaOpts.ui].forEach(runInFiberContext.bind(null, config.mochaOpts.ui));
    });

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
     * run before hook in fiber context
     */
    var beforeDefer = q.defer();
    Fiber(function() {
        try {
            config.before();
            beforeDefer.resolve();
        } catch(e) {
            beforeDefer.reject(e);
        }
    }).run();

    beforeDefer.promise.then(function() {
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
                    cid: cid,
                    title: payload.title,
                    pending: payload.pending || false,
                    parent: payload.parent ? payload.parent.title : null,
                    type: payload.tests ? 'suite' : 'test',
                    file: payload.file,
                    err: error,
                    duration: payload.duration,
                    runner: {}
                };

                message.runner[cid] = capabilities;
                process.send(message);
            });
        });
    }, defer.reject.bind(defer));

    return defer.promise;

};

var runInFiberContext = function (ui, fnName) {
    var origFn = global[fnName],
        interfaceTestFnName = interfaces[ui][2];

    var runSpec = function(specTitle, specFn) {
        return origFn.call(null, specTitle, function(done) {
            Fiber(function() {
                specFn();
                done();
            }).run();
        });
    };

    var runHook = function(specFn) {
        return origFn.call(null, function(done) {
            Fiber(function() {
                specFn();
                done();
            }).run();
        });
    };

    global[fnName] = function() {
        var args = Array.prototype.slice.call(arguments),
            specFn = typeof args[0] === 'function' ? args.shift() : args.pop(),
            specTitle = args[0];

        /**
         * if specFn is undefined we are dealing with a pending function
         */
        if(fnName === interfaceTestFnName && arguments.length === 1) {
            return origFn.call(null, arguments[0]);
        }

        if(fnName === interfaceTestFnName) {
            return runSpec(specTitle, specFn);
        }

        return runHook(specFn);
    };

    if(fnName === interfaceTestFnName) {
        global[fnName].skip = origFn.skip;
        global[fnName].only = origFn.only;
    }
};
