import path from 'node:path'
import { expect, describe, it, beforeAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

import { remote } from '../../../src/index.js'
import { requiresBidiNavigation } from '../../../src/commands/browser/url.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'
import { getContextManager } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/session/networkManager.js', () => ({
    getNetworkManager: vi.fn().mockImplementation(() => ({
        getPendingRequests: vi.fn().mockResolvedValue([]),
        initialize: vi.fn(),
        getRequestResponseData: vi.fn().mockResolvedValue({
            some: 'request'
        })
    }))
}))

vi.mock('../../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        getCurrentContext: vi.fn().mockResolvedValue({
            context: '123'
        }),
        getContext: vi.fn().mockResolvedValue({})
    }))
}))

describe('url', () => {
    let browser: WebdriverIO.Browser

    describe('classic', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('should accept a full url', async () => {
            await browser.url('http://google.com')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
                .toBe('/session/foobar-123/url')
            expect(vi.mocked(fetch).mock.calls[1][1]!.body)
                .toEqual(JSON.stringify({ url: 'http://google.com/' }))
        })

        it('should accept a relative url', async () => {
            await browser.url('/foobar')
            expect(vi.mocked(fetch).mock.calls[0][1]!.body)
                .toEqual(JSON.stringify({ url: 'http://foobar.com/foobar' }))
        })

        it('should throw an exception when a non-string value passed in', async () => {
            // @ts-ignore uses expect-webdriverio
            expect.assertions(1)

            try {
                // @ts-ignore test invalid parameter
                await browser.url(true)
            } catch (err: any) {
                expect(err.message).toContain('command needs to be type of string')
            }
        })

        it('should not fail with empty baseurl', async () => {
            browser = await remote({
                baseUrl: '',
                capabilities: {
                    browserName: 'foobar'
                }
            })

            await browser.url('/foobar')
            expect(vi.mocked(fetch).mock.calls[1][1]!.body)
                .toEqual(JSON.stringify({ url: 'http://foobar/' }))
        })

        afterEach(() => {
            vi.mocked(fetch).mockClear()
        })
    })

    describe('bidi', () => {
        let browsingContextNavigate: MockInstance
        let addInitScript: MockInstance
        let mock: MockInstance

        const mockMock = {
            requestOnce: vi.fn(),
            restore: vi.fn()
        }

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })
            browsingContextNavigate =  vi.spyOn(browser, 'browsingContextNavigate')
            browsingContextNavigate.mockImplementation((async () => ({
                navigation: '123'
            })) as any)
            addInitScript = vi.spyOn(browser, 'addInitScript').mockImplementation(() => Promise.resolve({
                remove: vi.fn()
            } as any))
            mock = vi.spyOn(browser, 'mock').mockImplementation(() => Promise.resolve(mockMock) as any)
        })

        beforeEach(() => {
            browsingContextNavigate.mockClear()
            addInitScript.mockClear()
            mock.mockClear()
            mockMock.requestOnce.mockClear()
            mockMock.restore.mockClear()
        })

        it('should use classic navigateTo on a darwin platformName when no BiDi-only options are set', async () => {
            browser.capabilities.platformName = 'darwin'
            const navigateTo = vi.spyOn(browser, 'navigateTo').mockResolvedValue(null as never)
            const req = await browser.url('http://google.com')
            expect(browsingContextNavigate).toBeCalledTimes(0)
            expect(navigateTo).toBeCalledTimes(1)
            expect(navigateTo).toBeCalledWith('http://google.com/')
            expect(req).toBeUndefined()
            navigateTo.mockRestore()
            delete browser.capabilities.platformName
        })

        it('should use browsingContextNavigate on non-macOS browser when no BiDi-only options are set', async () => {
            browser.capabilities.platformName = 'linux'
            const navigateTo = vi.spyOn(browser, 'navigateTo').mockResolvedValue(null as never)
            const req = await browser.url('http://google.com')
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(browsingContextNavigate).toBeCalledWith({
                context: { context: '123' },
                url: 'http://google.com/',
                wait: 'complete'
            })
            expect(navigateTo).toBeCalledTimes(0)
            expect(req).toEqual({ some: 'request' })
            navigateTo.mockRestore()
            delete browser.capabilities.platformName
        })

        it('should use browsingContextNavigate on macOS browser when BiDi-only options are set', async () => {
            browser.capabilities.platformName = 'mac'
            const req = await browser.url('http://google.com', { wait: 'none' })
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(browsingContextNavigate).toBeCalledWith({
                context: { context: '123' },
                url: 'http://google.com/',
                wait: 'none'
            })
            expect(req).toEqual({ some: 'request' })
            delete browser.capabilities.platformName
        })

        it('uses BiDi navigation on macOS when an active mock exists, even without BiDi-only options', async () => {
            browser.capabilities.platformName = 'darwin'
            const navigateTo = vi.spyOn(browser, 'navigateTo').mockResolvedValue(null as never)
            SESSION_MOCKS['some-context'] = new Set([{} as never])

            try {
                await browser.url('http://google.com')
                expect(browsingContextNavigate).toBeCalledTimes(1)
                expect(navigateTo).toBeCalledTimes(0)
            } finally {
                delete SESSION_MOCKS['some-context']
                navigateTo.mockRestore()
                delete browser.capabilities.platformName
            }
        })

        it('resolves the browsing context even on the classic macOS fast path', async () => {
            browser.capabilities.platformName = 'darwin'
            vi.spyOn(browser, 'navigateTo').mockResolvedValue(null as never)
            const callsBefore = vi.mocked(getContextManager).mock.calls.length

            await browser.url('http://google.com')

            expect(vi.mocked(getContextManager).mock.calls.length).toBeGreaterThan(callsBefore)
            delete browser.capabilities.platformName
        })

        it('allows to define different page load strategy', async () => {
            browser.capabilities.pageLoadStrategy = 'eager'
            await browser.url('http://google.com', { wait: 'interactive' })
            expect(browsingContextNavigate).toBeCalledWith(expect.objectContaining({
                wait: 'interactive'
            }))
        })

        it('supports to call init script', async () => {
            await browser.url('http://google.com', {
                onBeforeLoad: () => {
                    console.log('onBeforeLoad')
                }
            })
            expect(addInitScript).toBeCalledTimes(1)
            expect(addInitScript).toBeCalledWith(expect.any(Function))
        })

        it('supports to pass auth credentials', async () => {
            await browser.url('http://google.com', {
                auth: {
                    user: 'test',
                    pass: 'test'
                }
            })
            expect(mock).toBeCalledTimes(1)
            expect(mock).toBeCalledWith('http://google.com/')
            expect(mockMock.requestOnce).toBeCalledTimes(1)
            expect(mockMock.requestOnce).toBeCalledWith({
                headers: {
                    Authorization: 'Basic dGVzdDp0ZXN0'
                }
            })
            expect(mockMock.restore).toBeCalledTimes(1)
        })

        it('should fallback to navigateTo on concurrent navigation', async () => {
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation canceled by concurrent navigation')
            }) as any)
            const navigateTo = vi.spyOn(browser, 'navigateTo').mockResolvedValue(null as never)
            await browser.url('http://google.com', { wait: 'none' })
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(navigateTo).toBeCalledTimes(1)
            navigateTo.mockRestore()
        })

        it('should throw error if navigation fails', async () => {
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation failed')
            }) as any)
            await expect(browser.url('http://google.com', { wait: 'none' })).rejects.toThrow('navigation failed')
        })
    })

    describe('requiresBidiNavigation', () => {
        it('stays classic for empty / complete / unused timeout', () => {
            expect(requiresBidiNavigation()).toBe(false)
            expect(requiresBidiNavigation({})).toBe(false)
            expect(requiresBidiNavigation({ wait: 'complete' })).toBe(false)
            expect(requiresBidiNavigation({ timeout: 1000 })).toBe(false)
            expect(requiresBidiNavigation({ wait: 'complete', timeout: 1000 })).toBe(false)
        })

        it('requires BiDi for known BiDi-only options and unknown future keys', () => {
            expect(requiresBidiNavigation({ wait: 'none' })).toBe(true)
            expect(requiresBidiNavigation({ wait: 'networkIdle' })).toBe(true)
            expect(requiresBidiNavigation({ auth: { user: 'a', pass: 'b' } })).toBe(true)
            expect(requiresBidiNavigation({ headers: { 'X-Foo': '1' } })).toBe(true)
            expect(requiresBidiNavigation({ headers: {} })).toBe(true)
            expect(requiresBidiNavigation({ onBeforeLoad: () => {} })).toBe(true)
            // future option → BiDi by default (do not silently ignore)
            expect(requiresBidiNavigation({ somethingNew: true } as never)).toBe(true)
        })
    })
})
