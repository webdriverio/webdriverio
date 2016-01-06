describe('getTagName', () => {
    it('should return the tag name of a single element', async function () {
        (await this.client.getTagName('.black')).should.be.equal('div')
    })

    it('should return the location of multiple elements', async function () {
        const tagnames = await this.client.getTagName('.box')
        tagnames.should.be.an.instanceOf(Array)
        tagnames.should.have.length(5)

        for (const tagname of tagnames) {
            tagname.should.be.equal('div')
        }
    })
})
