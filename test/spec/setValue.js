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
})
