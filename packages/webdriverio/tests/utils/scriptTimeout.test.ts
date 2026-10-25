import { EventEmitter } from 'node:events'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { attach, remote } from '../../src/index.js'
import { markAttachedSession, scriptTimeoutOf, trackScriptTimeout } from '../../src/utils/scriptTimeout.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
    it('uses the capabilities of a new session after an attached session', async () => {
        const getTimeouts = vi.fn(async () => ({ script: 2_000 }))
        const browser = fakeBrowser({ timeouts: { script: 30_000 } }, 'attached-1', getTimeouts)
        markAttachedSession(browser)
        browser.sessionId = 'session-2'

        expect(await scriptTimeoutOf(browser)).toBe(30_000)
        expect(getTimeouts).not.toHaveBeenCalled()
    })

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

const ios = { platformName: 'iOS', browserName: 'Safari', 'appium:automationName': 'XCUITest' }
const timeoutRequests = () => vi.mocked(fetch).mock.calls
    .filter(([url, request]) => (url as URL).pathname === '/session/foobar-123/timeouts' && request?.method === 'POST')
    .map(([, request]) => JSON.parse((request as { body: string }).body))
const executeAsync = [expect.objectContaining({ pathname: '/session/foobar-123/execute/async' }), expect.anything()]

describe('script timeout of an iOS session (Appium)', () => {
    afterEach(() => {
        vi.mocked(fetch).mockClear()
        // @ts-expect-error mock feature
        fetch.resetCustomResponses()
    })

    it('sets the WebDriver default when the session starts', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: ios })
        expect(timeoutRequests()).toEqual([{ script: 30000 }])
        await browser.execute(async () => 1)
        await browser.execute(async () => 2)
        expect(timeoutRequests()).toEqual([{ script: 30000 }])
        expect(fetch).toHaveBeenCalledWith(...executeAsync)
    })

    it('sets the timeout of the capabilities, which Appium ignores', async () => {
        await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: 5000 } } })
        expect(timeoutRequests()).toEqual([{ script: 5000 }])
    })

    /**
     * W3C "process capabilities": the driver uses the first `firstMatch` entry that matches
     */
    it.each([
        [[{ timeouts: { script: 5000 } }], 5000],
        [[{}, { timeouts: { script: 5000 } }], 30000]
    ])('reads the timeout of the first firstMatch entry (%j)', async (firstMatch, script) => {
        await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { alwaysMatch: ios, firstMatch }
        } as unknown as Parameters<typeof remote>[0])
        expect(timeoutRequests()).toEqual([{ script }])
    })

    it('gives no limit as the 1 h limit of Appium', async () => {
        await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: null } } })
        expect(timeoutRequests()).toEqual([{ script: 3600000 }])
    })

    it('keeps no limit of alwaysMatch', async () => {
        await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { alwaysMatch: { ...ios, timeouts: { script: null } }, firstMatch: [{}] }
        } as unknown as Parameters<typeof remote>[0])
        expect(timeoutRequests()).toEqual([{ script: 3600000 }])
    })

    it('keeps a later browser.setTimeout()', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: ios })
        await browser.setTimeout({ script: 1000 })
        await browser.execute(async () => 1)
        expect(timeoutRequests()).toEqual([{ script: 30000 }, { script: 1000 }])
    })

    it('sets it again for the new session of reloadSession()', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: ios })
        await browser.reloadSession()
        expect(timeoutRequests()).toEqual([{ script: 30000 }, { script: 30000 }])
    })

    it('keeps the timeout of an attached session', async () => {
        const browser = await attach({ sessionId: 'foobar-123', protocol: 'http', hostname: 'localhost', port: 4444, path: '/', capabilities: ios })
        await browser.execute(async () => 1)
        expect(timeoutRequests()).toEqual([])
        expect(fetch).toHaveBeenCalledWith(...executeAsync)
    })

    it('sets it for the new session of an attached browser after reloadSession()', async () => {
        const browser = await attach({ sessionId: 'attached-1', protocol: 'http', hostname: 'localhost', port: 4444, path: '/', capabilities: ios, requestedCapabilities: ios })
        await browser.reloadSession()
        expect(timeoutRequests()).toEqual([{ script: 30000 }])
    })

    it('starts the session when the driver rejects the timeout', async () => {
        // @ts-expect-error mock feature
        fetch.customResponseFor(/\/timeouts$/, { value: { error: 'unknown error', message: 'boom' } })
        const browser = await remote({ baseUrl: 'http://foobar.com', connectionRetryCount: 0, capabilities: ios })
        expect(timeoutRequests()).toHaveLength(1)
        expect(await browser.execute(async () => 1)).toBe(1)
    })

    it.each([
        ['other browsers', { browserName: 'foobar' }],
        ['Android', { platformName: 'Android', browserName: 'Chrome', 'appium:automationName': 'UiAutomator2' }]
    ])('sets no timeout for %s', async (_, capabilities) => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities })
        await browser.execute(async () => 1)
        expect(timeoutRequests()).toEqual([])
    })
})
