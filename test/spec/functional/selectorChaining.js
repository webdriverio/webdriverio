describe('selectorChaining', () => {
    it('should find all .findme elements without any selector chaining', function () {
        return this.client.getText('.findme').then((elements) => elements.should.be.lengthOf(3))
    })

    it('should find only two .findme elements using selector chaining', function () {
        return this.client.element('.nested').getText('.findme').then(
            (elements) => elements.should.be.lengthOf(2))
    })

    it('should find only one element using double selector chaining', function () {
        return this.client.element('.nested').element('.moreNesting').getText('.findme').then(
            (elements) => elements.should.be.equal('MORE NESTED'))
    })

    it('should loose selector restriction after calling another command', function () {
        return this.client.element('.nested').element('.moreNesting').getText('.findme').getText('.findme').then(
            (elements) => elements.should.be.lengthOf(3))
    })

    it('should be possible to keep selector empty if element was used before', function () {
        return this.client.element('.nested').element('.moreNesting').element('.findme').getText().then(
            (elements) => elements.should.be.equal('MORE NESTED'))
    })

    it('should select cell using context of row', function () {
        return this.client.elements('tr').then((rows) => {
            var foundRows = []

            rows.value.forEach((element) => {
                var td1 = this.client.elementIdElement(element.ELEMENT, 'td=2015-03-02')
                var td2 = this.client.elementIdElement(element.ELEMENT, 'td=12:00')

                var p = Promise.all([td1, td2]).then(() => true, () => false)
                foundRows.push(p)
            })

            return Promise.all(foundRows).then((rows) => {
                rows.should.be.an.instanceOf(Array)
                rows.should.have.length(2)
                rows.should.contain(true)
                rows.should.contain(false)
            })
        })
    })
})
