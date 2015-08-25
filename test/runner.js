var WebdriverIO = require('../index.js'),
    q = require('q'),
    Mocha = require('mocha'),
    should = require('should'), // jshint ignore:line
    SauceLabs = require('saucelabs'),
    glob = require('glob'),
    merge  = require('deepmerge'),
    env = process.env._ENV,
    specDir = env.match(/^(functional|multibrowser)$/),
    failures = 0,
    client, sessionID, specFiles, specDir, browserA, browserB;

var mocha = new Mocha({
    timeout: 100000,
    reporter: 'spec'
});

// globals for tests
conf = require('./conf/index.js');
assert = require('chai').assert;
expect = require('chai').expect;

if(specDir) {
    // only test functional test spec if required
    specFiles = 'test/spec/' + specDir[0] + '/**/*.js';
} else {
    // otherwise test global + device specific test specs
    specFiles = '{test/spec/' + env + '/**/*.js,test/spec/*.js}';
}

function handleError(e) {
    console.log('========== ERROR ==========\n', e.message, '\n', e.stack);
    process.exit(1);
}

q.nfcall(glob, process.env._SPEC || specFiles).then(function(files) {

    files.forEach(function(file) {
        mocha.addFile(file);
    });

    console.log('-> Start Mocha tests');
    var mochaDefer = q.defer();
    mocha.run.call(mocha, mochaDefer.resolve.bind(mochaDefer));
    return mochaDefer.promise;

}, handleError).then(function(f) {
    failures = typeof f === 'number' ? f : f.failures || 'unknown';
    console.log('-> Mocha tests finished with', failures, 'failures');

    if (!client) {
        return process.exit(failures);
    }

    sessionID = (client.requestHandler || {}).sessionID;

    console.log('-> end all clients');
    return client[conf.runsWithSauce ? 'end' : 'endAll']().catch(function(e) {});

}, handleError).then(function() {

    /**
     * only update sauce job when running in CI
     */
    if (!process.env.TRAVIS_BUILD_ID || specDir) {
        return process.exit(failures);
    }

    var sauceAccount = new SauceLabs({
        username: process.env.SAUCE_USERNAME,
        password: process.env.SAUCE_ACCESS_KEY
    });

    console.log('-> update sauce job: ', sessionID);
    var updateJobDefer = q.defer();
    sauceAccount.updateJob(sessionID, {
        passed: failures === 0,
        public: true
    }, updateJobDefer.resolve.bind(updateJobDefer));
    return updateJobDefer.promise;

}, handleError).then(function(res) {

    console.log('-> sauce job updated', res);
    process.exit(failures);

});

h = {
    noError: function(err) {
        assert(err === undefined);
    },
    checkResult: function(expected) {
        return function(result) {
            if(expected instanceof Array) {
                return expected.should.containDeep([result]);
            }
            expected.should.be.exactly(result);
        };
    },
    setup: function(options) {

        if(!options) {
            options = {};
        }

        return function() {

            if(options.remoteOptions) {
                conf = merge(conf, options.remoteOptions);
            }

            /**
             * if instance already exists and no new session was requested return existing instance
             */
            if (client && client.requestHandler.sessionID && !options.newSession) {
                this.client = client;

            /**
             * if new session was requested create temporary instance
             */
            } else if(options.newSession) {
                this.client = WebdriverIO.remote(conf).init();

            /**
             * otherwise store created intance for other specs
             */
            } else {
                this.client = client = WebdriverIO.remote(conf).init();
            }

            return this.client.url(options.url || conf.testPage.start);
        };
    },
    setupMultibrowser: function(options) {

        if(!options) {
            options = {};
        }

        return function(done) {

            if(client && !options.asSingleton) {

                this.matrix = client;
                this.browserA = browserA;
                this.browserB = browserB;

            } else {

                this.matrix = WebdriverIO.multiremote(conf.capabilities).init();
                this.browserA = this.matrix.select('browserA');
                this.browserB = this.matrix.select('browserB');

                if(!options.asSingleton) {
                    client = this.matrix;
                    browserA = this.browserA;
                    browserB = this.browserB;
                }

            }

            this.matrix.url(options.url || conf.testPage.start).call(done);
        };
    },
    instanceLoop: function(cb) {
        var self = this;
        Object.keys(this.matrix.instances).forEach(function(instanceName) {
            cb.call(self, self.matrix[instanceName]);
        });
    }
};