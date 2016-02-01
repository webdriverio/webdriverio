describe('setValue', () => {
    const input = 'input[name="a"]'

    it('should reset value before setting it', async function () {
        await this.client.setValue(input, 'b').setValue(input, 'c');
        (await this.client.getValue(input)).should.be.equal('c')
    })

    it('allow number as value', async function () {
        await this.client.setValue(input, 11);
        (await this.client.getValue(input)).should.be.equal('11')
    })

    describe('is able to use unicode keys to', () => {
        it('understand complex characters and key modifiers', async function () {
            await this.client.setValue(input, [
                'Shift', '1', 'NULL', // !
                'Shift', '2', '3', '4', 'NULL', // @#$
                'Shift', '5', '6', 'NULL', // %^
                'Shift', '7', 'NULL', // &
                'Shift', '8', '9', '0' // *()
            ]);
            (['!@#$%^&*()', '!"§$%&/()=']).should.contain(await this.client.getValue(input))
        })

        it('use the numpad', async function () {
            await this.client.setValue(input, ['Numpad 0', 'Numpad 1', 'Numpad 2']);
            (await this.client.getValue(input)).should.be.equal('012')
        })
    })

    /* @see https://en.wikipedia.org/wiki/List_of_Unicode_characters
     * @see https://en.wikibooks.org/wiki/Unicode/Character_reference
     */
    describe('supports unicode planes', () => {
        it('supports BMP', async function () {
            await this.client.setValue(input, ''); // For BMP plane, try F021 character
            (await this.client.getValue(input)).should.be.equal('')
        })

        // As of 2015-11-01, on its version 2.20, "ChromeDriver only supports characters in the BMP".
        // TODO: Move down or remove this return as ChromeDriver supports more planes
        // other browser also failed here
        if (true) {
            return
        }

        it('supports SMP', async function () {
            await this.client.setValue(input, '😱'); // For SMP plane, try 1F631 character
            (await this.client.getValue(input)).should.be.equal('😱')
        })

        it('supports SIP', async function () {
            await this.client.setValue(input, '鬒'); // For SIP, try 2FA0
            (await this.client.getValue(input)).should.be.equal('鬒')
        })

        it('supports PUA', async function () {
            await this.client.setValue(input, '󴺜'); // For PUA, try F4E9C
            (await this.client.getValue(input)).should.be.equal('󴺜')
        })
    })
})
