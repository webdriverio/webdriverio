describe('clearElement', function() {

    before(h.setup());

    var input = 'input[name="a"]';

    it('knows to clear elements', function() {
        return this.client.getValue(input).then(function(res) {
            assert.equal(res, 'a');
        })
        .clearElement(input)
        .getValue(input).then(function(res) {
            assert.equal(res, '');
        });
    });

});