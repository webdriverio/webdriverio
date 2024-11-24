import { browser, expect } from '@wdio/globals'

describe('reloadSession', () => {
    it('can reload a session with new capabilities', async () => {
        const sessionId = browser.sessionId
        expect(browser.capabilities.browserName).toBe('chrome')
        await browser.reloadSession({
            browserName: 'edge',
            'ms:edgeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
        expect(browser.capabilities.browserName).toContain('MicrosoftEdge')
        expect(browser.sessionId).not.toBe(sessionId)
    })
})
