/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup(true));

    it('should delete a session', function(done) {

        var client = this.client;

        this.client

            // check if client has running session
            .session(function(err,res) {
                assert.ifError(err);
                assert.equal(res.status, 0);
            })

            // end session
            .end(function(err, tmp, res) {
                // check if session was closed
                assert.equal(res.session.status, 0);
                assert.equal(client.requestHandler.sessionID, null);
            })

            // reinitialize session for next tests
            .init(done);

    });

});