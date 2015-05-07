/**
 * sufficient to get tested with phantomjs
 */
describe('endAll', function() {

    /**
     * create a bunch of instances first
     */
    before(h.setup());

    it('should delete all sessions', function() {

        return this.client

            // check if client has running sessions
            .sessions().then(function(res) {
                assert.ok(res.value && res.value.length > 0);
            })

            // end sessions
            .endAll()

            // check if sessions were closed
            .sessions().then(function(res) {
                assert.ok(res.value.length === 0);
            });

    });

    /**
     * create new client instance to continue tests
     */
    after(h.setup(null));

});