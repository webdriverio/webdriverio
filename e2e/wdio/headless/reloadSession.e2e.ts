describe('reloadSession', () => {
    it('can reload a session', async () => {
        const sessionId = browser.sessionId
        await browser.reloadSession()
        expect(browser.sessionId).not.toBe(sessionId)
    })

    it('can reload a session with new capabilities', async () => {
        expect((browser.capabilities as WebdriverIO.Capabilities).browserName).toBe('chrome-headless-shell')
        await browser.reloadSession({
            browserName: 'edge',
            'ms:edgeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
        expect((browser.capabilities as WebdriverIO.Capabilities).browserName).toBe('edge-headless-shell')
    })
})
