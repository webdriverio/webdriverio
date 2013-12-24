/* globals for tests */

assert = require('assert');
conf = require('./conf/index.js');

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
        var client;

        /**
         * Only execute cross browser tests on changes within master branch.
         * For tests caused by pull requests PhantomJS tests are sufficient.
         */
        if((process.env.TRAVIS_BRANCH === 'master' && process.env._BROWSER === 'phantomjs') ||
           (process.env.TRAVIS_BRANCH !== 'master' && process.env._BROWSER !== 'phantomjs')) {
            console.log('This test was skipped');
            process.exit(0);
        }

        return function(done) {
            var wdjs = require('../index.js');

            if (client) {
                this.client = client;
            } else {
                this.client = client = new wdjs(conf).init();
            }

            this.client.url(conf.testPage.url, done);
        };
    })()
};