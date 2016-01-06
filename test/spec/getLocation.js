describe('getLocation', () => {
    it('should return the location of a single element', async function () {
        const location = await this.client.getLocation('header h1')
        /**
         * between devices and platform this can be different
         */
        location.x.should.be.below(27)
        location.y.should.be.below(27)
    })

    it('should return a specific property width of the location if set', async function () {
        (await this.client.getLocation('header h1', 'x')).should.be.below(27)
    })

    it('should return a specific property width of the location if set', async function () {
        (await this.client.getLocation('header h1', 'y')).should.be.below(27)
    })

    it('should return the location of multiple elements', async function () {
        const locations = await this.client.getLocation('.box')
        locations.should.be.an.instanceOf(Array)
        locations.should.have.length(5)

        for (const location of locations) {
            location.x.should.be.a('number')
            location.y.should.be.a('number')
        }
    })
})
