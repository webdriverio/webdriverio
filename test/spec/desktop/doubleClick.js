describe('doubleClick', () => {
    it('should make an element visible after doubleClick on .btn1', async function () {
        (await this.client.isVisible('.btn1_dblclicked')).should.be.false
        await this.client.doubleClick('.btn1');
        (await this.client.isVisible('.btn1_dblclicked')).should.be.true
    })
})
