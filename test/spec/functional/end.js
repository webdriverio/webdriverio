/**
 * sufficient to get tested with phantomjs
 */
describe('end', function() {

    before(h.setup(true));

    it('should delete a session', function(done) {

        this.client

            // check if client has running session
            .session(function(err,res) {
                assert.ifError(err);
                assert.ok(res.value);
            })

            // end session
            .end()

            // check if session was closed
            .session(function(err,res) {
                assert.ifError(err);
                assert.ifError(res.value);
            })
            .call(done);

    });

});