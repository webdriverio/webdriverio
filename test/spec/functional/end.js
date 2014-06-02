/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup(true));

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
                that.client.session('get', sessionID, function(err,res) {
                    assert.ifError(err);
                    assert.ifError(res.value);
                }).call(done);
            });

    });

});