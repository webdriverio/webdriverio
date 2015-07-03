describe('addValue', function() {

    before(h.setup());

    var searchinput = 'input.searchinput',
        input = 'input[name="a"]';

    it('add a value to existing input value', function() {
        return this.client
            .addValue(input, 'b')
            .addValue(input, 'c')
            .getValue(input).then(h.checkResult('abc'));
    });

    it('add a number value', function() {
        return this.client
            .clearElement(input)
            .addValue(input, 1)
            .addValue(input, 2.3)
            .getValue(input).then(h.checkResult('12.3'));
    });

    describe('is able to use unicode keys to', function() {

        it('navigate and delete inside inputs', function() {
            return this.client
                .clearElement(searchinput)
                .addValue(searchinput, '012')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Delete')
                .getValue(searchinput).then(h.checkResult('12'))
                .addValue(searchinput, 'Delete')
                .getValue(searchinput).then(h.checkResult('2'))
                .addValue(searchinput, 'Delete')
                .getValue(searchinput).then(h.checkResult(''))
                .addValue(searchinput, '0123')
                .addValue(searchinput, ['Back space', 'Back space'])
                .getValue(searchinput).then(h.checkResult('01'))
                .addValue(searchinput, ['Space', '01'])
                .getValue(searchinput).then(h.checkResult('01 01'));
        });

        it('release the modifier key by executing the command again', function() {
            return this.client
                .clearElement(searchinput)
                .addValue(searchinput, ['Shift', '1'])
                .addValue(searchinput, ['1'])
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, '!1');
                });
        });

    });

});
