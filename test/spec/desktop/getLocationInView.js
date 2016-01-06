describe('getLocationInView', () => {
    it('should return the location of a single element', async function () {
        const location = await this.client.getLocationInView('header h1')
        /**
         * between devices and platform this can be different
         */
        location.x.should.be.below(30)
        location.y.should.be.below(30)
    })

    it('should return only the x propery of a single element', async function () {
        (await this.client.getLocationInView('header h1', 'x')).should.be.below(30)
    })

    it('should return only the y propery of a single element', async function () {
        (await this.client.getLocationInView('header h1', 'y')).should.be.below(30)
    })

    it('should return the location of multiple elements', async function () {
        const locations = await this.client.getLocationInView('.box')
        locations.should.be.an.instanceOf(Array)
        locations.should.have.length(5)

        for (const location of locations) {
            location.x.should.be.a('number')
            location.y.should.be.a('number')
        }
    })
})
