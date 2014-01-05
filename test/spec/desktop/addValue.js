describe('addValue', function() {
    var input = 'input.searchinput';
    before(h.setup);
    beforeEach(clean);

    it.run = it;

    describe('simple usage', function() {
        it('can add values to an input', function(done) {
            this.client
                .addValue(input, '0', h.noError)
                .addValue(input, '1', h.noError)
                .addValue(input, '2', h.noError)
                .addValue(input, '3', h.noError)
                .getValue(input,     h.checkResult('0123'))
                .call(done);
        });
    });

    describe('unicode key controllers', function () {
        it('navigates and deletes inside inputs', function(done) {
            this.client
                .addValue(input, '012', h.noError)
                .addValue(input, 'Left arrow', h.noError)
                .addValue(input, 'Left arrow', h.noError)
                .addValue(input, 'Left arrow', h.noError)
                .addValue(input, 'Delete', h.noError)
                .getValue(input, h.checkResult('12'))
                .addValue(input, 'Delete', h.noError)
                .getValue(input, h.checkResult('2'))
                .addValue(input, 'Delete', h.noError)
                .getValue(input, h.checkResult(''))
                .addValue(input, '0123')
                .addValue(input, ['Back space', 'Back space'], h.noError)
                .getValue(input, h.checkResult('01'))
                .addValue(input, ['Space', '01'])
                .getValue(input, h.checkResult('01 01'))
                .call(done);
        });

        it('understand complex characters and key modifiers', function(done) {
            this.client
                .addValue(input, [
                    'Shift', '1', 'NULL',           // !
                    'Shift', '2', '3', '4', 'NULL', // @#$
                    'Shift', '5', '6', 'NULL',      // %^
                    'Shift', '7', 'NULL',           // &
                    'Shift','8','9','0'             // *()
                ], h.noError)
                .getValue(input, h.checkResult('!@#$%^&*()'))
                .call(done);
        });

        it('can use the numpad', function(done) {
            this.client
                .addValue(input, [
                    'Numpad 0', 'Numpad 1', 'Numpad 2', 'Numpad 3',
                    'Numpad 4', 'Numpad 5', 'Numpad 6', 'Numpad 7',
                    'Numpad 8', 'Numpad 9'
                ], h.noError)
                .getValue(input, h.checkResult('0123456789'))
                .call(done);
        });

        it[h.isMobile ? 'skip' : 'run']((h.isMobile ? '[SKIP ON MOBILE] ':'') + 'it should cut&paste a text via Control + x and Control + v', function(done) {
            var text = 'test';

            this.client
                // first set some text
                .setValue(input,text,h.noError)
                // mark text via shift + left arrow
                .addValue(input,['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], h.noError)
                // cut text
                .addValue(input,['Control','x','NULL'],h.noError)
                // test: input field should be empty
                .getValue(input,function(err,res) {
                    assert.equal(null, err);
                    assert.strictEqual(res,'');
                })
                // paste value from clipboard
                .addValue(input,['Control','v'],h.noError)
                .getValue(input,function(err,res) {
                    assert.equal(null, err);
                    assert.strictEqual(res,text);
                })
                .call(done);
        });

        it[h.isMobile ? 'skip' : 'run']((h.isMobile ? '[SKIP ON MOBILE] ':'') + 'it should copy&paste a text via Control + c and Control + v', function(done) {
            var text = 'test';

            this.client
                // first set some text
                .setValue('.searchinput',text,h.noError)
                // mark text via shift + left arrow
                .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], h.noError)
                // copy text and move cursor to the end of the input field
                .addValue('.searchinput',['Control','c','NULL','Right arrow'],h.noError)
                // test: input field should contain test value
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err);
                    assert.strictEqual(res,text);
                })
                // paste value from clipboard
                .addValue('.searchinput',['Control','v'],h.noError)
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err);
                    assert.strictEqual(res,text + text);
                })
                .call(done);
        });

        it('a new addValue command should release the modifier key', function(done) {
            this.client
                .addValue('.searchinput',['Shift','1'],h.noError)
                .addValue('.searchinput',['1'],h.noError)
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err);
                    assert.strictEqual(res,'!1');
                })
                .call(done);
        });

    });

    after(clean);

    function clean(done) {
        this.client.clearElement(input, done);
    }
});