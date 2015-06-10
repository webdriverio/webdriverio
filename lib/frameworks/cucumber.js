var q = require('q'),
    getFilePaths = require('../utils/ConfigParser').getFilePaths;

var CucumberReporter = function(BaseListener, capabilities) {
    var self = this;

    this.listener = BaseListener;
    this.capabilities = capabilities;
    this.failedCount = 0;

    Object.keys(CucumberReporter.prototype).forEach(function(fnName) {
        self.listener[fnName] = CucumberReporter.prototype[fnName].bind(self);
    });
};

CucumberReporter.prototype.handleBeforeFeatureEvent = function(event, callback) {
    var feature = event.getPayloadItem('feature');
    this.featureStart = new Date();
    this.runningFeature = feature;

    this.emit('suite:start', {
        title: feature.getName(),
        type: 'suite',
        file: this.getUriOf(feature)
    });

    process.nextTick(callback);
};

CucumberReporter.prototype.handleBeforeScenarioEvent = function(event, callback) {
    var scenario = event.getPayloadItem('scenario');
    this.runningScenario = scenario;
    this.scenarioStart = new Date();
    this.testStart = new Date();

    this.emit('suite:start', {
        title: scenario.getName(),
        parent: this.runningFeature.getName(),
        type: 'suite',
        file: this.getUriOf(scenario)
    });

    process.nextTick(callback);
};

CucumberReporter.prototype.handleStepResultEvent = function(event, callback) {
    var stepResult = event.getPayloadItem('stepResult'),
        step = stepResult.getStep(),
        e = stepResult.isSuccessful() ? 'pass' : stepResult.isFailed() || stepResult.isUndefined() ? 'fail' :
            stepResult.isPending() || stepResult.isSkipped() ? 'pending' : 'undefined',
        error = {};

    if(stepResult.isUndefined()) {
        error = {
            message: 'Step "' + step.getName() + ' is not defined!',
            stack: step.getUri() + ':' + step.getLine()
        };
        this.failedCount++;
    } else if(stepResult.isFailed()) {
        /**
         * cucumber failure exception can't get send to parent process
         * for some reasons
         */
        var err = stepResult.getFailureException();
        error = {
            message: err.message,
            stack: err.stack
        };
        this.failedCount++;
    }

    this.emit('test:' + e, {
        title: step.getName(),
        type: 'test',
        file: this.getUriOf(step),
        parent: this.runningScenario.getName(),
        error: error,
        duration: new Date() - this.testStart
    });

    this.testStart = new Date();
    process.nextTick(callback);
};

CucumberReporter.prototype.handleAfterScenarioEvent = function(event, callback) {
    var scenario = event.getPayloadItem('scenario');

    this.emit('suite:end', {
        title: scenario.getName(),
        parent: this.runningFeature.getName(),
        type: 'suite',
        file: this.getUriOf(scenario),
        duration: new Date() - this.scenarioStart
    });

    process.nextTick(callback);
};

CucumberReporter.prototype.handleAfterFeatureEvent = function(event, callback) {
    var feature = event.getPayloadItem('feature');

    this.emit('suite:end', {
        title: feature.getName(),
        type: 'suite',
        file: this.getUriOf(feature),
        duration: new Date() - this.featureStart
    });

    process.nextTick(callback);
};

CucumberReporter.prototype.emit = function(event, payload) {
    var message = {
        event: event,
        pid: process.pid,
        title: payload.title,
        pending: payload.pending || false,
        parent: payload.parent || null,
        type: payload.type,
        file: payload.file,
        err: payload.error || {},
        duration: payload.duration,
        runner: {}
    };

    message.runner[process.pid] = this.capabilities;
    process.send(message);
};

CucumberReporter.prototype.getListener = function() {
    return this.listener;
};

CucumberReporter.prototype.getUriOf = function(type) {
    return type.getUri().replace(process.cwd(),'');
};

/**
 * Cucumber runner
 */
module.exports.run = function(config, specs, capabilities) {
    var Cucumber = require('cucumber'),
        execOptions = ['node', 'node_modules/.bin/cucumber-js'],
        defer = q.defer(),
        cucumberResolvedRequire, cucumberConf, runtime, reporter;

    // Set up exec options for Cucumber
    execOptions = execOptions.concat(specs);
    if (config.cucumberOpts) {

        // Process Cucumber Require param
        if (config.cucumberOpts.require) {
            cucumberResolvedRequire = getFilePaths(config.cucumberOpts.require);
            if (cucumberResolvedRequire && cucumberResolvedRequire.length) {
                execOptions = cucumberResolvedRequire.reduce(function(a, fn) {
                    return a.concat('-r', fn);
                }, execOptions);
            }
        }

        // Process Cucumber Tag param
        if (Array.isArray(config.cucumberOpts.tags)) {
            for (var i in config.cucumberOpts.tags) {
                var tags = config.cucumberOpts.tags[i];
                execOptions.push('-t');
                execOptions.push(tags);
            }
        } else if (config.cucumberOpts.tags) {
            execOptions.push('-t');
            execOptions.push(config.cucumberOpts.tags);
        }

        // Process Cucumber Format param
        if (config.cucumberOpts.format) {
            execOptions.push('-f');
            execOptions.push(config.cucumberOpts.format);
        }

        // Process Cucumber 'coffee' param
        if (config.cucumberOpts.coffee) {
            execOptions.push('--coffee');
        }

        // Process Cucumber 'no-snippets' param
        if (config.cucumberOpts.noSnippets) {
            execOptions.push('--no-snippets');
        }
    }

    global.cucumber = Cucumber.Cli(execOptions);
    cucumberConf = Cucumber.Cli.Configuration(execOptions);
    runtime = Cucumber.Runtime(cucumberConf);
    reporter = new CucumberReporter(Cucumber.Listener(), capabilities);

    runtime.attachListener(reporter.getListener());

    q(config.before()).then(function() {
        runtime.start(function() {
            defer.resolve(reporter.failedCount);
        });
    });

    return defer.promise;

};