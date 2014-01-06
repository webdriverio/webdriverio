describe('element selector API', function() {
    before(h.setup);

    describe('using the old syntax', function() {
        it('returns an element', function(done) {
            this
                .client
                .element('css selector', '.box.red', function(err, res) {
                    assert.equal(err, null);
                    assert.ok(res.value.ELEMENT);
                    done(err);
                })
        });
    });

    describe('using the new syntax', function () {
        it('returns an element', function(done) {
            this
                .client
                .element('.box.red', function(err, res) {
                    assert.equal(err, null);
                    assert.ok(res.value.ELEMENT);
                    done(err);
                })
        });
    });
});