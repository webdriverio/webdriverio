describe('clearElement', function() {

    before(h.setup());

    var input = 'input[name="a"]';

    it('knows to clear elements', function(done) {

        this.client
            .getValue(input, function(err, res) {
                assert.ifError(err);
                assert.equal(res, 'a');
            })
            .clearElement(input)
            .getValue(input, function(err, res) {
                assert.ifError(err);
                assert.equal(res, '');
            })
            .call(done);

    });

});