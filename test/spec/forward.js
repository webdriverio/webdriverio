describe('forward', () => {
    it('should be able to go forward in history', async function () {
        await this.client
            /**
             * first create a history
             */
            .click('=two')
            .pause(3000)
            /**
             * go back in history (via execute)
             * here we just want to test the forward command
             */
            .back()
            .pause(3000)
            /**
             * now go back in history
             */
            .forward()
            .pause(1000);

        (await this.client.getTitle()).should.be.equal('two')
    })
})
