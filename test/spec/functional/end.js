/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup({ newSession: true }));

    it('should delete a session', function() {

        var sessions;

        return this.client

            // check if client has a running session
            .sessions().then(function(res) {
                assert.ok(res.value);
                sessions = res.value.length;
            })

            // end session
            .end()

            // check if session was closed
            .then(function() {
                return this.sessions().then(function(openSessions) {
                    openSessions.value.should.have.length(sessions - 1);
                });
            });

    });

});