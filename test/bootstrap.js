assert = require('assert');
conf = require('./conf/index.js');
client = require('../index.js').remote(conf);
client.init().url(conf.testPage.url);
helper = {
    noError: function(err) {
        assert(err === null);
    },
    checkResult: function(expected) {
        return function(err, result) {
            helper.noError(err);
            assert.strictEqual(result, expected);
        }
    }
}