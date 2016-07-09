describe('refresh', () => {
    it('should refresh a session', async function () {
        const oldSessionId = this.client.requestHandler.sessionID

        // refresh session
        await this.client.reload()

        const newSessionId = this.client.requestHandler.sessionID
        newSessionId.should.be.not.equal(oldSessionId)
    })
})
