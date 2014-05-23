describe('setValue', function() {

    before(h.setup());

    var input = 'input[name="a"]';

    it('should reset value before setting it', function(done) {
        this.client
            .setValue(input, 'b', h.noError)
            .setValue(input, 'c', h.noError)
            .getValue(input, h.checkResult('bc'))
            .call(done);
    });

    describe('is able to use unicode keys to', function() {

        it('understand complex characters and key modifiers', function(done) {
            this.client
                .setValue(input, [
                    'Shift', '1', 'NULL', // !
                    'Shift', '2', '3', '4', 'NULL', // @#$
                    'Shift', '5', '6', 'NULL', // %^
                    'Shift', '7', 'NULL', // &
                    'Shift', '8', '9', '0' // *()
                ])
                .getValue(input, h.checkResult('!@#$%^&*()'))
                .call(done);
        });

        it('use the numpad', function(done) {
            this.client
                .setValue(input, ['Numpad 0', 'Numpad 1', 'Numpad 2'])
                .getValue(input, h.checkResult('012'))
                .call(done);
        });

    });

});