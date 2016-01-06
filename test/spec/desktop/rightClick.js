describe('rightclick', () => {
    it('text should be visible after right-clicking on .btn1', async function () {
        (await this.client.isVisible('.btn1_right_clicked')).should.be.false
        await this.client.rightClick('.btn1');
        (await this.client.isVisible('.btn1_right_clicked')).should.be.true
    })
})
