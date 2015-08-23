var webdriverjs = require('../../../index.js'),
    assert = require('assert'),
    sessionID = 'ba8ca350-e0e3-4a73-aab5-1679559cdcd2',
    startPath = '/abc/xyz';

describe('remote method', function() {

    it('does not fail without options', function() {

        assert.doesNotThrow(function() {
            webdriverjs.remote();
        });

    });

    it('attaches client to existing session', function() {

        var client = webdriverjs.remote(sessionID);
        assert.strictEqual(client.requestHandler.sessionID, sessionID);

    });

    it('should be able to set startPath', function() {

        var client = webdriverjs.remote({ path: startPath });
        assert.strictEqual(client.requestHandler.startPath, startPath);

    });

});