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

    /* @see https://en.wikipedia.org/wiki/List_of_Unicode_characters
     * @see https://en.wikibooks.org/wiki/Unicode/Character_reference
     */
    describe('supports unicode planes', function() {

        it('supports BMP', function() {
            return this.client
                .setValue(input, '') // For BMP plane, try F021 character
                .getValue(input).then(h.checkResult(''));
        });

        // As of 2015-11-01, on its version 2.20, "ChromeDriver only supports characters in the BMP".
        // TODO: Move down or remove this return as ChromeDriver supports more planes
        // other browser also failed here.
        if(true) {
            return;
        }

        it('supports SMP', function() {
            return this.client
                .setValue(input, '😱') // For SMP plane, try 1F631 character
                .getValue(input).then(h.checkResult('😱'));
        });

        it('supports SIP', function() {
            return this.client
                .setValue(input, '鬒') // For SIP, try 2FA0
                .getValue(input).then(h.checkResult('鬒'));
        });

        it('supports PUA', function() {
            return this.client
                .setValue(input, '󴺜') // For PUA, try F4E9C
                .getValue(input).then(h.checkResult('󴺜'));
        });

    });
});
