var Mocha     = require('mocha'),
    SauceLabs = require('saucelabs'),
    glob      = require('glob'),
    env       = process.env._ENV || 'desktop',
    client;

var mocha = new Mocha({
    timeout: 1000000,
    reporter: 'spec'
});

glob('{test/spec/' + env + '/*.js,test/spec/*.js}', function (er, files) {

    files.forEach(function(file) {
        mocha.addFile(file);
    });

    mocha.run(function(failures) {
        if (!client) {
            return process.exit(failures);
        }

        client.end(function() {

            if(process.env.TRAVIS_BUILD_NUMBER) {
                var sauceAccount = new SauceLabs({
                    username: process.env.SAUCE_USERNAME,
                    password: process.env.SAUCE_ACCESS_KEY
                });

                sauceAccount.updateJob(client.requestHandler.sessionID, {
                    passed: failures === 0,
                    public: true
                },function(err,res){
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
conf   = require('./conf/index.js');
assert = require('assert');

h = {
    noError: function(err) {
        assert(err === null);
    },
    checkResult: function(expected) {
        return function(err, result) {
            h.noError(err);
            assert.strictEqual(result, expected);
        };
    },
    setup: (function() {
        return function(done) {
            var wdjs = require('../index.js');

            if (client) {
                this.client = client;
            } else {
                this.client = client = wdjs.remote(conf).init();
            }

            this.client.url(conf.testPage.start, done);
        };
    })()
};