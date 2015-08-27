var q = require('q'),
    Fiber = require('fibers'),
    hasES6Support = require('../helpers/detectHarmony');

var JasmineReporter = function(capabilities) {
    this._capabilities = capabilities;
    this._parent = [];
    this._failedCount = 0;
};

JasmineReporter.prototype.suiteStarted = function(suite) {
    this._suiteStart = new Date();
    suite.type = 'suite';
    this.emit('suite:start', suite);
    this._parent.push(suite.description);
};

JasmineReporter.prototype.specStarted = function(test) {
    this._testStart = new Date();
    test.type = 'test';
    this.emit('test:start', test);
};

JasmineReporter.prototype.specDone = function(test) {
    var e = 'test:' + test.status.replace(/ed/, '');
    test.type = 'test';
    test.duration = new Date() - this._testStart;
    this.emit(e, test);
    this._failedCount += test.status === 'failed' ? 1 : 0;
};

JasmineReporter.prototype.suiteDone = function(suite) {
    this._parent.pop();
    suite.type = 'suite';
    suite.duration = new Date() - this._suiteStart;
    this.emit('suite:end', suite);
};

JasmineReporter.prototype.emit = function(event, payload) {
    var message = {
        event: event,
        pid: process.pid,
        title: payload.description,
        pending: payload.status === 'pending',
        parent: this._parent.length ? this._parent[this._parent.length - 1] : null,
        type: payload.type,
        file: '',
        err: payload.failedExpectations.length ? payload.failedExpectations[0] : null,
        duration: payload.duration,
        runner: {}
    };

    message.runner[process.pid] = this._capabilities;
    process.send(message);
};


/**
 * Jasmine 2.x runner
 */
exports.run = function(cid, config, specs, capabilities) {
    var Jasmine = require('jasmine'),
        jrunner = new Jasmine(),
        jasmineNodeOpts = config.jasmineNodeOpts,
        jasmineDefaultTimeout = 60000,
        defer = q.defer();

    jrunner.projectBaseDir = '';
    jrunner.specDir = '';
    jrunner.addSpecFiles(specs);

    if (jasmineNodeOpts && jasmineNodeOpts.defaultTimeoutInterval) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineNodeOpts.defaultTimeoutInterval;
    } else {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineDefaultTimeout;
    }

    var reporter = new JasmineReporter(cid, capabilities);
    jrunner.addReporter(reporter);

    // Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert.
    jasmine.getEnv().specFilter = function(spec) {
        var grepMatch = !jasmineNodeOpts || !jasmineNodeOpts.grep || spec.getFullName().match(new RegExp(jasmineNodeOpts.grep)) !== null;
        var invertGrep = !!(jasmineNodeOpts && jasmineNodeOpts.invertGrep);
        if (grepMatch == invertGrep) {
            spec.pend();
        }
        return true;
    };

    /**
     * enable expectHandler
     */
    if(typeof jasmineNodeOpts.expectationResultHandler === 'function') {
        var old = jasmine.Spec.prototype.addExpectationResult;
        jasmine.Spec.prototype.addExpectationResult = function(passed, data) {
            try {
                jasmineNodeOpts.expectationResultHandler.call(browser, passed, data);
            } catch(e) {
                /**
                 * propagate expectationResultHandler error if actual assertion passed
                 */
                if(passed) {
                    passed = false;
                    data = {
                        passed: false,
                        message: 'expectationResultHandlerError: ' + e.message
                    };
                }
            }

            return old.call(this, passed, data);
        };
    }

    ['it', 'beforeEach', 'beforeAll', 'afterEach', 'afterAll'].forEach(runInFiberContext);

    jrunner.onComplete(function() {
        defer.resolve(reporter._failedCount);
    });

    q(config.before()).then(function() {
        try {
            jrunner.execute();
        } catch(e) {
            defer.reject({
                message: e.message,
                stack: e.stack
            });
        }
    }, defer.reject.bind(defer));

    return defer.promise;
};

var runInFiberContext = function (fnName) {
    var origFn = global[fnName],
        specTitle, specFn, specTimeout;

    var runSpec = function(specTitle, specFn) {
        return origFn.call(null, specTitle, function(done) {
            Fiber(function() {
                specFn();
                done();
            }).run();
        });
    };

    var runHook = function(specFn, specTimeout) {
        return origFn.call(null, function(done) {
            Fiber(function() {
                specFn();
                done();
            }).run();
        }, specTimeout);
    };

    global[fnName] = function() {
        var args = Array.prototype.slice.call(arguments);

        if(fnName === 'it') {
            specTitle = args[0];
            specFn = args[1];
            return runSpec(specTitle, specFn);
        }

        specFn = args[0];
        specTimeout = args[1];
        return runHook(specFn, specTimeout);
    };
};