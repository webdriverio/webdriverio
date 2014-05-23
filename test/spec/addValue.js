describe('addValue', function() {

    before(h.setup());

    var searchinput = 'input.searchinput',
        input = 'input[name="a"]',
        clean = function(done) { this.client.clearElement(searchinput, done) };

    it('add a value to existing input value', function(done) {
        this.client
            .addValue(input, 'b')
            .addValue(input, 'c')
            .getValue(input, h.checkResult('abc'))
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

        it('cut&paste a text via Control + x and Control + v', function(done) {
            var text = 'test';

            this.client
                .clearElement(searchinput)
                // first set some text
                .addValue(searchinput, text)
                // mark text via shift + left arrow
                .addValue(searchinput, ['Shift', 'Left arrow', 'Left arrow', 'Left arrow', 'Left arrow', 'NULL'])
                // cut text
                .addValue(searchinput, ['Control', 'x', 'NULL'])
                // test: input field should be empty
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, '');
                })
                // paste value from clipboard
                .addValue(searchinput, ['Control', 'v'])
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, text);
                })
                .call(done);
        });

        it('copy&paste a text via Control + c and Control + v', function(done) {
            var text = 'test';

            this.client
                .clearElement(searchinput)
                // first set some text
                .addValue(searchinput, text)
                // mark text via shift + left arrow
                .addValue(searchinput, ['Shift', 'Left arrow', 'Left arrow', 'Left arrow', 'Left arrow', 'NULL'])
                // copy text and move cursor to the end of the input field
                .addValue(searchinput, ['Control', 'c', 'NULL', 'Right arrow'])
                // test: input field should contain test value
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, text);
                })
                // paste value from clipboard
                .addValue(searchinput, ['Control', 'v'])
                .getValue(searchinput, function(err, res) {
                    assert.ifError(err);
                    assert.strictEqual(res, text + text);
                })
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