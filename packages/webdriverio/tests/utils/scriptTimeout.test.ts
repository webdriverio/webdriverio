import { EventEmitter } from 'node:events'

import { describe, expect, it, vi } from 'vitest'

import { markAttachedSession, scriptTimeoutOf, trackScriptTimeout } from '../../src/utils/scriptTimeout.js'

function fakeBrowser (capabilities: Record<string, unknown> = {}, sessionId = 'session-1', getTimeouts?: () => Promise<unknown>) {
    return Object.assign(new EventEmitter(), { sessionId, capabilities, ...(getTimeouts ? { getTimeouts } : {}) }) as unknown as WebdriverIO.Browser & EventEmitter
}

function setTimeoutsResult (script: unknown, result: unknown = { value: null }) {
    return { command: 'setTimeouts', body: { implicit: undefined, pageLoad: undefined, script }, result }
}

describe('scriptTimeoutOf', () => {
    it('uses the script timeout of the session capabilities', async () => {
        const getTimeouts = vi.fn()
        expect(await scriptTimeoutOf(fakeBrowser({ timeouts: { script: 12_000 } }, 'session-1', getTimeouts))).toBe(12_000)
        expect(await scriptTimeoutOf(fakeBrowser({ timeouts: { script: null } }, 'session-1', getTimeouts))).toBe(null)
        expect(getTimeouts).not.toHaveBeenCalled()
    })

    /**
     * an attached session: its capabilities are the ones the user passed
     */
    it('reads the script timeout of the session once when the capabilities have none', async () => {
        const getTimeouts = vi.fn(async () => ({ implicit: 0, pageLoad: 300_000, script: 60_000 }))
        const browser = fakeBrowser({}, 'session-1', getTimeouts)

        expect(await scriptTimeoutOf(browser)).toBe(60_000)
        expect(await scriptTimeoutOf(browser)).toBe(60_000)
        expect(getTimeouts).toHaveBeenCalledTimes(1)

        const noLimit = fakeBrowser({}, 'session-1', async () => ({ script: null }))
        expect(await scriptTimeoutOf(noLimit)).toBe(null)
    })

    /**
     * `attach()` gets its capabilities from the user, e.g. the ones of the session
     * when it was created: the session can have another script timeout by now
     */
    it('reads the script timeout of an attached session, also when its capabilities have one', async () => {
        const getTimeouts = vi.fn(async () => ({ script: 2_000 }))
        const browser = fakeBrowser({ timeouts: { script: 30_000 } }, 'session-1', getTimeouts)
        markAttachedSession(browser)

        expect(await scriptTimeoutOf(browser)).toBe(2_000)
        expect(await scriptTimeoutOf(browser)).toBe(2_000)
        expect(getTimeouts).toHaveBeenCalledTimes(1)

        trackScriptTimeout(browser)
        browser.emit('result', setTimeoutsResult(5_000))
        expect(await scriptTimeoutOf(browser)).toBe(5_000)
    })

    it('returns a script timeout that setTimeouts set while the session timeout was read', async () => {
        let answer: (timeouts: unknown) => void = () => {}
        const browser = fakeBrowser({}, 'session-1', () => new Promise((resolve) => (answer = resolve)))
        trackScriptTimeout(browser)

        const timeout = scriptTimeoutOf(browser)
        browser.emit('result', setTimeoutsResult(2_000))
        answer({ script: 30_000 })

        expect(await timeout).toBe(2_000)
        expect(await scriptTimeoutOf(browser)).toBe(2_000)
    })

    it('uses the default of the WebDriver spec when the session timeout cannot be read', async () => {
        expect(await scriptTimeoutOf(fakeBrowser())).toBe(30_000)
        expect(await scriptTimeoutOf(fakeBrowser({}, 'session-1', async () => { throw new Error('unknown command') }))).toBe(30_000)
        expect(await scriptTimeoutOf({ sessionId: 'x' } as unknown as WebdriverIO.Browser)).toBe(30_000)
    })

    it('follows a successful setTimeouts command', async () => {
        const browser = fakeBrowser({ timeouts: { script: 30_000 } })
        trackScriptTimeout(browser)

        browser.emit('result', setTimeoutsResult(2_000))
        expect(await scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(undefined))
        expect(await scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(5_000, { error: new Error('invalid argument') }))
        expect(await scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(null))
        expect(await scriptTimeoutOf(browser)).toBe(null)
    })

    it('ignores the value of an earlier session after a reload', async () => {
        const browser = fakeBrowser({ timeouts: { script: 30_000 } })
        trackScriptTimeout(browser)
        browser.emit('result', setTimeoutsResult(2_000))

        Object.assign(browser, { sessionId: 'session-2', capabilities: { timeouts: { script: 15_000 } } })
        expect(await scriptTimeoutOf(browser)).toBe(15_000)
    })

    it('adds one listener per browser', () => {
        const browser = fakeBrowser()
        trackScriptTimeout(browser)
        trackScriptTimeout(browser)
        expect(browser.listenerCount('result')).toBe(1)
    })
})
