import { describe, it, expect, vi } from 'vitest'

import { matchHeadedUserAgent } from '../../src/daemon/userAgent.js'
import type { Session } from '../../src/session.js'

const HEADLESS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36'

function fakeSession ({ headless = true, isBidi = true, target = 'chrome', args = ['--headless=new'], userAgent = HEADLESS_UA } = {}) {
    const browser = {
        execute: vi.fn(async () => userAgent),
        emulationSetUserAgentOverride: vi.fn(async () => ({}))
    }
    const key = target === 'edge' ? 'ms:edgeOptions' : 'goog:chromeOptions'
    const session = {
        isBidi,
        browser,
        plan: { headless, target, capabilities: { browserName: target, [key]: { args } } }
    } as unknown as Session
    return { session, browser }
}

describe('matchHeadedUserAgent', () => {
    it('sends the user agent of a headed window for headless chrome', async () => {
        const { session, browser } = fakeSession()
        await matchHeadedUserAgent(session)
        expect(browser.emulationSetUserAgentOverride).toHaveBeenCalledWith({
            userAgent: HEADLESS_UA.replace('HeadlessChrome/', 'Chrome/')
        })
    })

    it('does the same for headless edge', async () => {
        const { session, browser } = fakeSession({ target: 'edge', userAgent: `${HEADLESS_UA} Edg/154.0.0.0` })
        await matchHeadedUserAgent(session)
        expect(browser.emulationSetUserAgentOverride).toHaveBeenCalledWith({
            userAgent: `${HEADLESS_UA.replace('HeadlessChrome/', 'Chrome/')} Edg/154.0.0.0`
        })
    })

    it('keeps a user agent given with --arg', async () => {
        const { session, browser } = fakeSession({ args: ['--headless=new', '--user-agent=my-agent'] })
        await matchHeadedUserAgent(session)
        expect(browser.execute).not.toHaveBeenCalled()
        expect(browser.emulationSetUserAgentOverride).not.toHaveBeenCalled()
    })

    it('leaves headed, classic and non-chromium sessions alone', async () => {
        for (const opts of [{ headless: false }, { isBidi: false }, { target: 'firefox' }]) {
            const { session, browser } = fakeSession(opts)
            await matchHeadedUserAgent(session)
            expect(browser.emulationSetUserAgentOverride).not.toHaveBeenCalled()
        }
    })

    it('leaves a user agent without the headless token alone', async () => {
        const { session, browser } = fakeSession({ userAgent: HEADLESS_UA.replace('HeadlessChrome/', 'Chrome/') })
        await matchHeadedUserAgent(session)
        expect(browser.emulationSetUserAgentOverride).not.toHaveBeenCalled()
    })
})
