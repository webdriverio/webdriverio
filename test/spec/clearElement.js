describe('clearElement', function () {
    var input = 'input.searchinput';
    before(h.setup);

    it('knows to clear elements', function(done) {
        this.client
            .addValue(input, 'Salut')
            .clearElement(input)
            .getValue(input, function(err, res) {
                assert.equal(err, null);
                assert.equal(res, '');
                done();
            });
    });
});