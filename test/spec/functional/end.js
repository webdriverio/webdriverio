/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    beforeEach(h.setup({ newSession: true }));

    it('should return a Promise once the session has been deleted', function(done) {

        var promise = this.client

            // check if client has running sessions
            .sessions().then(function(res) {
                assert.ok(res.value && res.value.length > 0);
            })

            // end sessions
            .end();

        expect(promise).to.have.property('then');
        promise.then(function (res) {
            expect(res.state).to.equal('success');
        })
        .then(done)
        .catch(done);
    });

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
