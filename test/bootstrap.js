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
        }
    },
    setup: (function() {
        var client;

        return function(done) {
            var wdjs = require('../index.js');

            if (client) {
                this.client = client;
            } else {
                this.client = client = new wdjs(conf).init();
            }

            this.client.url(conf.testPage.url, done);
        }
    })()
}