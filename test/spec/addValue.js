describe('addValue', function() {
    var input = 'input.searchinput';
    beforeEach(clean);

    describe('simple usage', function() {
        it('can add values to an input', function(done) {
            this.browser
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
            this.browser
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
            this.browser
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
            this.browser
                .pause(1)
                .addValue(input, [
                    'Numpad 0', 'Numpad 1', 'Numpad 2', 'Numpad 3',
                    'Numpad 4', 'Numpad 5', 'Numpad 6', 'Numpad 7',
                    'Numpad 8', 'Numpad 9'
                ], helper.noError)
                .getValue(input, helper.checkResult('0123456789'))
                .call(done)
        })
    });

    after(clean);

    function clean(done) {
        this.browser.clearElement(input, done);
    }
});