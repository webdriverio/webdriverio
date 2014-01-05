var request = require('request');

describe('teardown', function() {

    if (process.env.TRAVIS !== undefined) {
        it('it marks tests on saucelabs as passed/failed', function(done) {
            // mark travis job as passed
            var options = {
                headers: { 'Content-Type': 'text/json' },
                url: 'http://' + process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY + '@saucelabs.com/rest/v1/' + process.env.SAUCE_USERNAME + '/jobs/' + this.client.requestHandler.sessionID,
                method: 'PUT',
                body: JSON.stringify({
                    passed: true
                })
            };

            request(options, done);
        });
    }

    it('stops the client', function(done) {
        this.client.endAll(done);
    });
});