import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('execute test', () => {
    it('should execute the script', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.execute((a, b, c) => a + b + c, 1, 2, 3)
        expect((vi.mocked(fetch).mock.calls[1][0] as any).pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)).toEqual(expect.objectContaining({
            script: expect.stringContaining('return ((a, b, c) => a + b + c).apply(null, arguments)'),
            args: [1, 2, 3]
        }))
    })

    it('should return correct value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const result = await browser.execute((value) => value, 'foobar')
        expect(result).toEqual('foobar')
    })

    it('should await an async function via execute/async', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).mockClear()
        await browser.execute(async (value: string) => value, 'foobar')
        const [requestUrl, request] = vi.mocked(fetch).mock.calls.at(-1)!
        expect((requestUrl as URL).pathname).toBe('/session/foobar-123/execute/async')
        expect(JSON.parse((request as { body: string }).body).script).toContain('async (value)')
    })

    it('should return objects that mention __wdioError without throwing', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).mockClear()
        const result = await browser.execute(async () => ({ __wdioError: false, data: 1 }))
        expect(result).toEqual({ __wdioError: false, data: 1 })
    })

    it('should return the value of an async function that awaits', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).mockClear()
        const result = await browser.execute(async () => {
            await Promise.resolve()
            await Promise.resolve()
            return 7
        })
        expect(result).toBe(7)
    })

    it('should throw if script is wrong type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error
        await expect(() => browser.execute(null)).rejects.toThrow()
        // @ts-expect-error
        await expect(() => browser.execute(1234)).rejects.toThrow()
    })

    describe('script timeout on iOS (Appium)', () => {
        const ios = { platformName: 'iOS', browserName: 'Safari', 'appium:automationName': 'XCUITest' }
        const timeoutRequests = () => vi.mocked(fetch).mock.calls
            .filter(([url, request]) => (url as URL).pathname === '/session/foobar-123/timeouts' && request?.method === 'POST')
            .map(([, request]) => JSON.parse((request as { body: string }).body))
        const calls = () => vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname.replace('/session/foobar-123/', ''))

        it('sets the WebDriver default once, before the first async script', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: ios })
            vi.mocked(fetch).mockClear()
            await browser.execute(async () => 1)
            await browser.execute(async () => 2)
            expect(timeoutRequests()).toEqual([{ script: 30000 }])
            expect(calls()).toEqual(['timeouts', 'execute/async', 'execute/async'])
        })

        it('sets the timeout of the capabilities, which Appium ignores', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: 5000 } } })
            vi.mocked(fetch).mockClear()
            await browser.execute(async () => 1)
            expect(timeoutRequests()).toEqual([{ script: 5000 }])
        })

        it('gives no limit as the longest timer delay', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { ...ios, timeouts: { script: null } } })
            vi.mocked(fetch).mockClear()
            await browser.execute(async () => 1)
            expect(timeoutRequests()).toEqual([{ script: 2147483647 }])
        })

        it('keeps a script timeout of browser.setTimeout()', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: ios })
            await browser.setTimeout({ script: 1000 })
            vi.mocked(fetch).mockClear()
            await browser.execute(async () => 1)
            expect(timeoutRequests()).toEqual([])
        })

        it.each([
            ['a function that is not async on iOS', ios, () => 1],
            ['an async function in other browsers', { browserName: 'foobar' }, async () => 1],
            ['an async function on Android', { platformName: 'Android', browserName: 'Chrome', 'appium:automationName': 'UiAutomator2' }, async () => 1]
        ])('does not set a timeout for %s', async (_, capabilities, script) => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities })
            vi.mocked(fetch).mockClear()
            await browser.execute(script)
            expect(timeoutRequests()).toEqual([])
        })
    })
})
