describe('click', () => {
    it('text should be visible after clicking on .btn1', async function () {
        const elemSelector = '//html/body/section/div[7]'
        const buttonSelector = '//html/body/section/button[1]';

        (await this.client.isVisible(elemSelector)).should.be.equal(false)
        await this.client.click(buttonSelector);
        (await this.client.isVisible(elemSelector)).should.be.equal(true)
    })
})
