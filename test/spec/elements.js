describe('elements selector API', function() {
    before(h.setup);

    describe('using the old syntax', function() {
        it('returns many elements', function(done) {
            this
                .client
                .elements('css selector', '.box', function(err, res) {
                    assert.equal(err, null);
                    assert.ok(res.value.length > 1);
                    done(err);
                })
        });
    });

    describe('using the new syntax', function () {
        it('returns many elements', function(done) {
            this
                .client
                .elements('.box', function(err, res) {
                    assert.equal(err, null);
                    assert.ok(res.value.length > 1);
                    done(err);
                })
        });
    });
});