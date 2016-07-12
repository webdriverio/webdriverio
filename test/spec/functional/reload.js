describe('reload', () => {
    it('should reload a session', async function () {
        const oldSessionId = this.client.requestHandler.sessionID

        // reload session
        await this.client.reload()

        const newSessionId = this.client.requestHandler.sessionID
        newSessionId.should.be.not.equal(oldSessionId)
    })
})
