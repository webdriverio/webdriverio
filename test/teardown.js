var request = require('saucelabs');

describe('teardown', function() {

    it('it marks tests on saucelabs as passed/failed', function(done) {

        if(this.client.options.username && this.client.options.accessKey) {

            var sauceAccount = new SauceLabs({
                username: this.client.options.username,
                password: this.client.options.accessKey
            });

            sauceAccount.stopJob(this.client.requestHandler.sessionID, {
                passed: true,
                public: true
            },done);

        } else {
            done();
        }

    });

    it('stops the client', function(done) {
        this.client.endAll(done);
    });
});