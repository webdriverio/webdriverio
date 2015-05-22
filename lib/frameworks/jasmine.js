var q = require('q');

var JasmineReporter = function(capabilities) {
    this._capabilities = capabilities;
    this._parent = [];
};

JasmineReporter.prototype.suiteStarted = function(suite) {
    this._parent.push(suite.description);
    this._suiteStart = new Date();
    suite.type = 'suite';
    this.emit('suite:start', suite);
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
        err: {},
        duration: payload.duration,
        runner: {}
    };

    message.runner[process.pid] = this._capabilities;
    process.send(message);
};


/**
 * Jasmine 2.x runner
 */
exports.run = function(config, specs, capabilities) {
    var Jasmine = require('jasmine'),
        jrunner = new Jasmine(),
        jasmineNodeOpts = config.jasmineNodeOpts,
        defer = q.defer();

    jrunner.configureDefaultReporter(jasmineNodeOpts || {});
    jrunner.projectBaseDir = '';
    jrunner.specDir = '';
    jrunner.addSpecFiles(specs);

    if (jasmineNodeOpts && jasmineNodeOpts.defaultTimeoutInterval) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineNodeOpts.defaultTimeoutInterval;
    }

    var reporter = new JasmineReporter(capabilities);
    jasmine.getEnv().addReporter(reporter);

    // Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert.
    jasmine.getEnv().specFilter = function(spec) {
        var grepMatch = !jasmineNodeOpts || !jasmineNodeOpts.grep || spec.getFullName().match(new RegExp(jasmineNodeOpts.grep)) !== null;
        var invertGrep = !!(jasmineNodeOpts && jasmineNodeOpts.invertGrep);
        if (grepMatch == invertGrep) {
            spec.pend();
        }
        return true;
    };

    // var originalOnComplete = runner.getConfig().onComplete;
    jrunner.onComplete(function(passed) {
        try {
            // if (originalOnComplete) {
            //     originalOnComplete(passed);
            // }
            defer.resolve({
                failedCount: reporter.failedCount,
                specResults: reporter.testResult
            });
        } catch (err) {
            defer.reject(err);
        }
    });
    jrunner.execute();

    return defer.promise;
};