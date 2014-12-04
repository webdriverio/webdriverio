describe('addValue', function() {

    before(h.setup());

    var searchinput = 'input.searchinput',
        input = 'input[name="a"]';

    it('add a value to existing input value', function(done) {
        this.client
            .addValue(input, 'b')
            .addValue(input, 'c')
            .getValue(input, h.checkResult('abc'))
            .call(done);
    });

    it('add a number value', function(done) {
        this.client
            .clearElement(input)
            .addValue(input, 1)
            .addValue(input, 2.3)
            .getValue(input, h.checkResult('12.3'))
            .call(done);
    });

    describe('is able to use unicode keys to', function() {

        it('navigate and delete inside inputs', function(done) {
            this.client
                .clearElement(searchinput)
                .addValue(searchinput, '012')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Delete')
                .getValue(searchinput, h.checkResult('12'))
                .addValue(searchinput, 'Delete')
                .getValue(searchinput, h.checkResult('2'))
                .addValue(searchinput, 'Delete')
                .getValue(searchinput, h.checkResult(''))
                .addValue(searchinput, '0123')
                .addValue(searchinput, ['Back space', 'Back space'])
                .getValue(searchinput, h.checkResult('01'))
                .addValue(searchinput, ['Space', '01'])
                .getValue(searchinput, h.checkResult('01 01'))
                .call(done);
        });

        it('release the modifier key by executing the command again', function(done) {
            this.client
                .clearElement(searchinput)
                .addValue(searchinput, ['Shift', '1'])
                .addValue(searchinput, ['1'])
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, '!1');
                })
                .call(done);
        });

    });

});
