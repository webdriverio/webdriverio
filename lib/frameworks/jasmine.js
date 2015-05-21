var q = require('q');

var JasmineReporter = function() {
    this.testResult = [];
    this.failedCount = 0;
};

JasmineReporter.prototype.jasmineStarted = function() {

};

JasmineReporter.prototype.specStarted = function() {
    this.startTime = new Date();
};

JasmineReporter.prototype.specDone = function(result) {
    var specInfo = {
        name: result.description,
        category: result.fullName.slice(0, -result.description.length).trim()
    };
    if (result.status == 'passed') {
        this.emitter.emit('testPass', specInfo);
    } else if (result.status == 'failed') {
        this.emitter.emit('testFail', specInfo);
        this.failedCount++;
    }

    var entry = {
        description: result.description,
        assertions: [],
        duration: new Date().getTime() - this.startTime.getTime()
    };

    if (result.failedExpectations.length === 0) {
        entry.assertions.push({
            passed: true
        });
    }

    result.failedExpectations.forEach(function(item) {
        entry.assertions.push({
            passed: item.passed,
            errorMsg: item.passed ? undefined : item.message,
            stackTrace: item.passed ? undefined : item.stack
        });
    });
    this.testResult.push(entry);
};


/**
 * Jasmine 2.x runner
 */
exports.run = function(config, specs, capabilities) {
    var Jasmine = require('jasmine'),
        jrunner = new Jasmine(),
        jasmineNodeOpts = config.jasmineNodeOpts,
        defer = q.defer(),
        runner;

    jrunner.configureDefaultReporter(jasmineNodeOpts);
    jrunner.projectBaseDir = '';
    jrunner.specDir = '';
    jrunner.addSpecFiles(specs);

    if (jasmineNodeOpts && jasmineNodeOpts.defaultTimeoutInterval) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineNodeOpts.defaultTimeoutInterval;
    }

    var reporter = new JasmineReporter();
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

    var originalOnComplete = runner.getConfig().onComplete;
    jrunner.onComplete(function(passed) {
        try {
            if (originalOnComplete) {
                originalOnComplete(passed);
            }
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