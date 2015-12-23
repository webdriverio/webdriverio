describe('addValue', () => {
    const searchinput = 'input.searchinput'
    const input = 'input[name="a"]'

    it('add a value to existing input value', async function () {
        await this.client.addValue(input, 'b').addValue(input, 'c');
        (await this.client.getValue(input)).should.be.equal('abc')
    })

    it('add a number value', async function () {
        await this.client.clearElement(input).addValue(input, 1).addValue(input, 2.3);
        (await this.client.getValue(input)).should.be.equal('12.3')
    })

    describe('is able to use unicode keys too', () => {
        it('navigate and delete inside inputs', async function () {
            await this.client
                .clearElement(searchinput)
                .addValue(searchinput, '012')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Left arrow')
                .addValue(searchinput, 'Delete');
            (await this.client.getValue(searchinput)).should.be.equal('12')

            await this.client.addValue(searchinput, 'Delete');
            (await this.client.getValue(searchinput)).should.be.equal('2')

            await this.client.addValue(searchinput, 'Delete');
            (await this.client.getValue(searchinput)).should.be.equal('')

            await this.client
                .addValue(searchinput, '0123')
                .addValue(searchinput, ['Back space', 'Back space']);
            (await this.client.getValue(searchinput)).should.be.equal('01')

            await this.client.addValue(searchinput, ['Space', '01']);
            (await this.client.getValue(searchinput)).should.be.equal('01 01')
        })

        it('release the modifier key by executing the command again', async function () {
            await this.client
                .clearElement(searchinput)
                .addValue(searchinput, ['Shift', '1'])
                .addValue(searchinput, ['1']);
            (await this.client.getValue(searchinput)).should.be.equal('!1')
        })
    })
})
