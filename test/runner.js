var WebdriverIO = require('../index.js'),
    Mocha = require('mocha'),
    should = require('should'),
    SauceLabs = require('saucelabs'),
    glob = require('glob'),
    merge  = require('deepmerge'),
    env = process.env._ENV,
    client, matrix, specFiles, specDir;

var mocha = new Mocha({
    timeout: 1000000,
    reporter: 'spec'
});

if(specDir = env.match(/^(functional|multibrowser)$/)) {
    // only test functional test spec if required
    specFiles = 'test/spec/' + specDir[0] + '/**/*.js';
} else {
    // otherwise test global + device specific test specs
    specFiles = '{test/spec/' + env + '/**/*.js,test/spec/*.js}';
}

glob(process.env._SPEC || specFiles, function(er, files) {

    files.forEach(function(file) {
        mocha.addFile(file);
    });

    mocha.run(function(failures) {
        if (!client) {
            return process.exit(failures);
        }

        var sessionID = client.requestHandler.sessionID;

        client.end(function() {

            if (process.env.TRAVIS_BUILD_NUMBER) {
                var sauceAccount = new SauceLabs({
                    username: process.env.SAUCE_USERNAME,
                    password: process.env.SAUCE_ACCESS_KEY
                });

                console.log('update job', sessionID);
                sauceAccount.updateJob(sessionID, {
                    passed: failures === 0,
                    public: true
                }, function(err, res) {
                    console.log(err || res);
                    process.exit(failures);
                });
            } else {
                process.exit(failures);
            }
        });
    });
});

// globals for tests
conf = require('./conf/index.js');
assert = require('assert');

h = {
    noError: function(err) {
        assert(err === undefined);
    },
    checkResult: function(expected) {
        return function(err, result) {
            h.noError(err);

            if(expected instanceof Array) {
                expected.should.containDeep([result]);
            } else {
                expected.should.be.exactly(result);
            }

        };
    },
    setup: function(options) {

        if(!options) {
            options = {};
        }

        return function(done) {

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

            this.client.url(options.url || conf.testPage.start, done);
        };
    },
    setupMultibrowser: function(options) {

        if(!options) {
            options = {};
        }

        return function(done) {

            if(matrix && !options.asSingleton) {

                this.matrix = matrix;
                this.browserA = browserA;
                this.browserB = browserB;

            } else {

                this.matrix = WebdriverIO.multiremote(conf.capabilities).init();
                this.browserA = this.matrix.select('browserA');
                this.browserB = this.matrix.select('browserB');

                if(!options.asSingleton) {
                    matrix = this.matrix;
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