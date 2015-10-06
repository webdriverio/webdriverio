var q = require('q'),
    coMocha = require('co-mocha'),
    path = require('path');

/**
 * Mocha runner
 */
module.exports.run = function(config, specs, capabilities) {
    var Mocha = require('mocha'),
        defer = q.defer(),
        compilers = config.mochaOpts.compilers,
        requires = config.mochaOpts.require,
        runner;

    /**
     * enable generators if supported
     */
    coMocha(Mocha);

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
