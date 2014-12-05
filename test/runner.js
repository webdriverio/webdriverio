var Mocha = require('mocha'),
    should = require('should'),
    SauceLabs = require('saucelabs'),
    glob = require('glob'),
    merge  = require('deepmerge'),
    env = process.env._ENV,
    client, specFiles;

var mocha = new Mocha({
    timeout: 1000000,
    reporter: 'spec'
});

if(env === 'functional') {
    // only test functional test spec if required
    specFiles = 'test/spec/functional/*.js';
} else {
    // otherwise test global + device specific test specs
    specFiles = '{test/spec/' + env + '/*.js,test/spec/*.js}';
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
        return function(done) {
            var wdjs = require('../index.js');

            if(!options) {
                options = {};
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
                this.client = wdjs.remote(conf).init();

            /**
             * otherwise store created intance for other specs
             */
            } else {
                this.client = client = wdjs.remote(conf).init();
            }

            this.client.url(options.url || conf.testPage.start, done);
        };
    }
};