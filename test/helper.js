'use strict';

var WebdriverIO = require('../index.js'),
    merge = require('deepmerge'),
    client, browserA, browserB;

function end(passed, done) {
    var SauceLabs, sessionID, endCommand;

    if (process.env.TRAVIS_BUILD_NUMBER) {
        SauceLabs = require('saucelabs');
    }

    if (!client) {
        return done(false);
    }

    sessionID = (client.requestHandler || {}).sessionID;
    endCommand = conf.runsWithSauce ? 'end' : 'endAll';

    client[endCommand]().then(function() {
        if (process.env.TRAVIS_BUILD_NUMBER) {
            var sauceAccount = new SauceLabs({
                username: process.env.SAUCE_USERNAME,
                password: process.env.SAUCE_ACCESS_KEY
            });

            sauceAccount.updateJob(sessionID, {
                passed: passed === true,
                public: true
            }, function(err, res) {
                console.log(err || res);
                if (err)
                    return done(err);
                return done();
            });
        } else {
            return done();
        }
    }, done);
}

module.exports = {
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

        return function(done) {

            function init() {
                return WebdriverIO.remote(conf).init();
            }

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
                this.client = init();

            /**
             * otherwise store created intance for other specs
             */
            } else {
                this.client = client = init();
            }

            return this.client
            .url(options.url || conf.testPage.start)
            .then(function () {
                done();
            })
            .catch(done);
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
    },
    success: function (done) {
        end.call(this, true, done)
    },
    failure: function(done) {
        end.call(this, false, done)
    }
};
