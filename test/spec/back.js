describe('back', () => {
    it('should be able to go backward in history', async function () {
        await this.client
            /**
             * first create a history
             */
            .click('=two')
            .pause(3000)
            /**
             * go back in history
             */
            .back()
            .pause(3000);

        (await this.client.getTitle()).should.be.equal('WebdriverJS Testpage')
    })
})
