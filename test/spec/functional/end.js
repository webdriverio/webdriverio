/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup({ newSession: true }));

    it('should delete a session', function(done) {

        var that = this,
            sessionID;

        this.client

            // check if client has a running session
            .session(function(err,res) {
                assert.ifError(err);
                assert.ok(res.value);

                sessionID = that.client.requestHandler.sessionID;
            })

            // end session
            .end()

            // check if session was closed
            .call(function() {
                that.client.sessions('get', sessionID, function(err,res) {
                    assert.ifError(err);
                    res.value.forEach(function(session) {
                        session.id.should.not.equal(sessionID);
                    });
                }).call(done);
            });

    });

});