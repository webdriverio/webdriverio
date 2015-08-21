var q = require('q'),
    co = require('co'),
    path = require('path'),
    hasES6Support = require('../helpers/detectHarmony'),
    interfaces = {
        bdd: ['before', 'beforeEach', 'it', 'after', 'afterEach'],
        tdd: ['suiteSetup', 'setup', 'test', 'suiteTeardown', 'teardown']
    };

/**
 * Mocha runner
 */
module.exports.run = function(config, specs, capabilities) {
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

    /**
     * enable generators if supported
     */
    if(hasES6Support) {
        mocha.suite.on('pre-require', function() {
            interfaces[config.mochaOpts.ui].forEach(runInGenerator.bind(null, config.mochaOpts.ui));
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

var runInGenerator = function (ui, fnName) {
    var origFn = global[fnName],
        interfaceTestFnName = interfaces[ui][2];

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
        if(fnName === interfaceTestFnName && arguments.length === 1) {
            return origFn.call(null, arguments[0]);
        }

        /**
         * only run in a generator if * is set
         */
        if(specFn.toString().slice(0, 9) !== 'function*') {
            return origFn.call(null, specTitle || specFn, specFn);
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
