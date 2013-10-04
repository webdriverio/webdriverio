assert = require('assert');
conf = require('./conf/index.js');
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