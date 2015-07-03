describe('setValue', function() {

    before(h.setup());

    var input = 'input[name="a"]';

    it('should reset value before setting it', function() {
        return this.client
            .setValue(input, 'b')
            .setValue(input, 'c')
            .getValue(input).then(h.checkResult('c'));
    });

    it('allow number as value', function() {
        return this.client
            .setValue(input, 11)
            .getValue(input).then(h.checkResult('11'));
    });

    describe('is able to use unicode keys to', function() {

        it('understand complex characters and key modifiers', function() {
            return this.client
                .setValue(input, [
                    'Shift', '1', 'NULL', // !
                    'Shift', '2', '3', '4', 'NULL', // @#$
                    'Shift', '5', '6', 'NULL', // %^
                    'Shift', '7', 'NULL', // &
                    'Shift', '8', '9', '0' // *()
                ])
                .getValue(input).then(h.checkResult(['!@#$%^&*()','!"§$%&/()=']));
        });

        it('use the numpad', function() {
            return this.client
                .setValue(input, ['Numpad 0', 'Numpad 1', 'Numpad 2'])
                .getValue(input).then(h.checkResult('012'));
        });

    });

});
