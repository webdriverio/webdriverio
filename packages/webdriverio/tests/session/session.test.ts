import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionManager } from '../../src/session/session.js'

describe('SessionManager', () => {
    const browser ={
        sessionId: '123',
        on: vi.fn(),
    } as unknown as WebdriverIO.Browser

    beforeEach(()=>{
        vi.mocked(browser.on).mockClear()
    })

    it('should listener registered', ()=>{
        new SessionManager(browser, 'dummy')
        expect(browser.on).toHaveBeenCalledTimes(1)
    })

    it('should listener registered only once when initialized multiple times', ()=>{
        browser.sessionId = '456'
        new SessionManager(browser, 'dummy')
        new SessionManager(browser, 'dummy')
        expect(browser.on).toHaveBeenCalledTimes(1)
    })
})