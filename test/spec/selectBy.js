describe('selectBy', () => {
    describe('VisibleText', () => {
        it('should find element without special conditions', async function () {
            await this.client.selectByVisibleText('#selectTest', 'seis');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue6')
        })

        it('should find element with spaces before and after the text', async function () {
            await this.client.selectByVisibleText('#selectTest', 'dos');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue2')
        })

        it('should find element with spaces before and after the text parameter', async function () {
            await this.client.selectByVisibleText('#selectTest', '   cinco  ');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue5')
        })
    })

    describe('Index', () => {
        it('should find element without special conditions', async function () {
            await this.client.selectByIndex('#selectTest', 3);
            (await this.client.getValue('#selectTest')).should.be.equal('someValue4')
        })

        it('should throw error if index is negative', async function () {
            return this.client.selectByIndex('#selectTest', -2).catch((err) => {
                expect(err).not.to.be.undefined
                expect(err).not.to.be.null
            })
        })

        it('should throw error if index is higher than number of options', async function () {
            return this.client.selectByIndex('#selectTest', 99).catch((err) => {
                expect(err).not.to.be.undefined
                expect(err).not.to.be.null
            })
        })
    })

    describe('Value', () => {
        it('should find element without special conditions', async function () {
            await this.client.selectByValue('#selectTest', 'someValue1');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue1')
        })

        it('should find element with spaces before and after the value', async function () {
            await this.client.selectByValue('#selectTest', 'someValue3');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue3')
        })

        it('should find element with spaces before and after the value parameter', async function () {
            await this.client.selectByValue('#selectTest', '    someValue5    ');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue5')
        })
    })
})
