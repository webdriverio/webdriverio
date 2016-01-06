describe('getCssProperty', () => {
    it('should return a color attribute to test with properly', async function () {
        const bgColor = await this.client.getCssProperty('.red', 'background-color')
        bgColor.value.should.be.equal('rgba(255,0,0,1)')
        bgColor.parsed.hex.should.be.equal('#ff0000')
        bgColor.parsed.alpha.should.be.equal(1)
        bgColor.parsed.type.should.be.equal('color')
    })

    it('should return a number attribute to test with properly', async function () {
        const width = await this.client.getCssProperty('.red', 'width')
        width.value.should.be.equal('100px')
        width.parsed.value.should.be.equal(100)
        width.parsed.type.should.be.equal('number')
        width.parsed.unit.should.be.equal('px')
        width.parsed.string.should.be.equal('100px')
    })

    it('should return a font attribute to test with properly', async function () {
        const font = await this.client.getCssProperty('.red', 'font-family')
        font.value.should.be.equal('helvetica neue')
        font.parsed.value.should.be.an.instanceOf(Array)
        font.parsed.value.should.have.length(4)
        font.parsed.value.should.contain('helvetica neue')
        font.parsed.value.should.contain('helvetica')
        font.parsed.value.should.contain('arial')
        font.parsed.value.should.contain('sans-serif')
    })

    it('should return multiple css attributes if selector matches multiple elements', async function () {
        const display = await this.client.getCssProperty('.box', 'display')
        display.should.be.an.instanceOf(Array)
        display.should.have.length(5)
        expect(display).to.have.deep.property('[0].property', 'display')
        expect(display).to.have.deep.property('[0].value', 'block')
        expect(display).to.have.deep.property('[0].parsed.string', 'block')
    })
})
