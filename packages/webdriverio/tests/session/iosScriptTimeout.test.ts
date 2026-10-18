import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { attach, remote } from '../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const ios = { platformName: 'iOS', browserName: 'Safari', 'appium:automationName': 'XCUITest' }
const timeoutRequests = () => vi.mocked(fetch).mock.calls
    .filter(([url, request]) => (url as URL).pathname === '/session/foobar-123/timeouts' && request?.method === 'POST')
    .map(([, request]) => JSON.parse((request as { body: string }).body))
const calls = () => vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname.replace('/session/foobar-123/', ''))

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
        expect(calls().slice(-2)).toEqual(['execute/async', 'execute/async'])
    })

    it('sets the timeout of the capabilities, which Appium ignores', async () => {
        await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: 5000 } } })
        expect(timeoutRequests()).toEqual([{ script: 5000 }])
    })

    it('reads the timeout from firstMatch', async () => {
        await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { alwaysMatch: ios, firstMatch: [{}, { timeouts: { script: 5000 } }] }
        } as unknown as Parameters<typeof remote>[0])
        expect(timeoutRequests()).toEqual([{ script: 5000 }])
    })

    it('gives no limit as the longest timer delay', async () => {
        await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: null } } })
        expect(timeoutRequests()).toEqual([{ script: 2147483647 }])
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
        expect(calls()).toEqual(['execute/async'])
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
