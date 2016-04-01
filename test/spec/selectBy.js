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

        it('should find element with quotes around the text', async function () {
            await this.client.selectByVisibleText('#selectTest', '"siete"');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue7')
        })

        it('should find element with quotes in the text', async function () {
            await this.client.selectByVisibleText('#selectTest', 'ocho "huit" (otto)');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue8')
        })

        it('should find element with a quote in the text', async function () {
            await this.client.selectByVisibleText('#selectTest', 'nu"eve');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue9')
        })

        it('should find element with a quote at the end of the text', async function () {
            await this.client.selectByVisibleText('#selectTest', 'diez"');
            (await this.client.getValue('#selectTest')).should.be.equal('someValue10')
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

    describe('Attribute', () => {
        describe('Value', () => {
            it('should find element without special conditions', async function () {
                await this.client.selectByAttribute('#selectTest', 'value', 'someValue1');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue1')
            })

            it('should find element with spaces before and after the value', async function () {
                await this.client.selectByAttribute('#selectTest', 'value', 'someValue3');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue3')
            })

            it('should find element with spaces before and after the value parameter', async function () {
                await this.client.selectByAttribute('#selectTest', 'value', '    someValue5    ');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue5')
            })
        })

        describe('Name', () => {
            it('should find element without special conditions', async function () {
                await this.client.selectByAttribute('#selectTest', 'name', 'someName7');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue7')
            })

            it('should find element with spaces before and after the name', async function () {
                await this.client.selectByAttribute('#selectTest', 'name', 'someName9');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue9')
            })

            it('should find element with spaces before and after the name parameter', async function () {
                await this.client.selectByAttribute('#selectTest', 'name', '    someName8    ');
                (await this.client.getValue('#selectTest')).should.be.equal('someValue8')
            })
        })
    })
})
