describe('getText', () => {
    it('should return the text of a single element', async function () {
        (await this.client.getText('#githubRepo')).should.be.equal('GitHub Repo')
    })

    it('should return the text of multiple elements', async function () {
        const texts = await this.client.getText('.box')
        texts.should.be.an.instanceOf(Array)
        texts.should.have.length(5)

        for (const text of texts) {
            text.should.be.equal('')
        }
    })
})
