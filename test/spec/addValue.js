describe('addValue', function() {
    var input = 'input.searchinput';
    beforeEach(clean);

    describe('simple usage', function() {
        it('can add values to an input', function(done) {
            client
                .pause(1) // We should not have to pause!
                .addValue(input, '0', helper.noError)
                .addValue(input, '1', helper.noError)
                .addValue(input, '2', helper.noError)
                .addValue(input, '3', helper.noError)
                .getValue(input,     helper.checkResult('0123'))
                .call(done);
        });
    });

    describe('unicode key controllers', function () {
        it('navigates and deletes inside inputs', function(done) {
            client
                .pause(1) // We should not have to pause!
                .addValue(input, '012', helper.noError)
                .addValue(input, 'Left arrow', helper.noError)
                .addValue(input, 'Left arrow', helper.noError)
                .addValue(input, 'Left arrow', helper.noError)
                .addValue(input, 'Delete', helper.noError)
                .getValue(input, helper.checkResult('12'))
                .addValue(input, 'Delete', helper.noError)
                .getValue(input, helper.checkResult('2'))
                .addValue(input, 'Delete', helper.noError)
                .getValue(input, helper.checkResult(''))
                .addValue(input, '0123')
                .addValue(input, ['Back space', 'Back space'], helper.noError)
                .getValue(input, helper.checkResult('01'))
                .addValue(input, ['Space', '01'])
                .getValue(input, helper.checkResult('01 01'))
                .call(done)
        });

        it('understand complex characters and key modifiers', function(done) {
            client
                .pause(1)
                .addValue(input, [
                    'Shift', '1', 'NULL',           // !
                    'Shift', '2', '3', '4', 'NULL', // @#$
                    'Shift', '5', '6', 'NULL',      // %^
                    'Shift', '7', 'NULL',           // &
                    'Shift','8','9','0'             // *()
                ], helper.noError)
                .getValue(input, helper.checkResult('!@#$%^&*()'))
                .call(done)
        });

        it('can use the numpad', function(done) {
            client
                .pause(1)
                .addValue(input, [
                    'Numpad 0', 'Numpad 1', 'Numpad 2', 'Numpad 3',
                    'Numpad 4', 'Numpad 5', 'Numpad 6', 'Numpad 7',
                    'Numpad 8', 'Numpad 9'
                ], helper.noError)
                .getValue(input, helper.checkResult('0123456789'))
                .call(done)
        })

        it('it should cut&paste a text via Control + x and Control + v', function(done) {
            var text = 'test';

            client
                .pause(1)
                // first set some text
                .setValue('.searchinput',text,helper.noError)
                // mark text via shift + left arrow
                .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], helper.noError)
                // cut text
                .addValue('.searchinput',['Control','x','NULL'],helper.noError)
                // test: input field should be empty
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err)
                    assert.strictEqual(res,'');
                })
                // paste value from clipboard
                .addValue('.searchinput',['Control','v'],helper.noError)
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err)
                    assert.strictEqual(res,text);
                })
                .call(done);
        });

        it('it should copy&paste a text via Control + c and Control + v', function(done) {
            var text = 'test';

            client
                .pause(1)
                // first set some text
                .setValue('.searchinput',text,helper.noError)
                // mark text via shift + left arrow
                .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], helper.noError)
                // copy text and move cursor to the end of the input field
                .addValue('.searchinput',['Control','c','NULL','Right arrow'],helper.noError)
                // test: input field should contain test value
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err)
                    assert.strictEqual(res,text);
                })
                // paste value from clipboard
                .addValue('.searchinput',['Control','v'],helper.noError)
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err)
                    assert.strictEqual(res,text + text);
                })
                .call(done);
        });

        it('a new addValue command should release the modifier key', function(done) {
            client
                .pause(1)
                .addValue('.searchinput',['Shift','1'],helper.noError)
                .addValue('.searchinput',['1'],helper.noError)
                .getValue('.searchinput',function(err,res) {
                    assert.equal(null, err)
                    assert.strictEqual(res,'!1');
                })
                .call(done);
        });

    });

    after(clean);

    function clean(done) {
        client.clearElement(input, done);
    }
});