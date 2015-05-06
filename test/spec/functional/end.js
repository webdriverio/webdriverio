/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup({ newSession: true }));

    it('should delete a session', function() {

        var that = this,
            sessionID;

        return this.client

            // check if client has a running session
            .session().then(function(res) {
                assert.ok(res.value);
                sessionID = that.client.requestHandler.sessionID;
            })

            // end session
            .end()

            // check if session was closed
            .then(function() {
                return this.sessions('get', sessionID).then(function(openSessions) {
                    openSessions.value.should.have.length(0);
                });
            });

    });

});