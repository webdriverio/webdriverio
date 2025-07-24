import path from 'node:path'
import { expect, describe, it, beforeAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

import { remote } from '../../../src/index.js'

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
        let url: MockInstance
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
            url = vi.spyOn(browser, 'url')
            addInitScript = vi.spyOn(browser, 'addInitScript').mockImplementation(() => Promise.resolve({
                remove: vi.fn()
            } as any))
            mock = vi.spyOn(browser, 'mock').mockImplementation(() => Promise.resolve(mockMock) as any)
        })

        beforeEach(() => {
            browsingContextNavigate.mockClear()
            url.mockClear()
            addInitScript.mockClear()
            mock.mockClear()
            mockMock.requestOnce.mockClear()
            mockMock.restore.mockClear()
        })

        it('should use browsingContextNavigate', async () => {
            const req = await browser.url('http://google.com')
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(browsingContextNavigate).toBeCalledWith({
                context: { context: '123' },
                url: 'http://google.com/',
                wait: 'complete'
            })
            expect(req).toEqual({ some: 'request' })
        })

        it('allows to define different page load strategy', async () => {
            browser.capabilities.pageLoadStrategy = 'eager'
            await browser.url('http://google.com')
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

        it('should fallback to url on concurrent navigation', async () => {
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation canceled by concurrent navigation')
            }) as any)
            await browser.url('http://google.com')
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(url).toBeCalledTimes(1)
            expect(url).toBeCalledWith('http://google.com')
        })

        it('should throw error if navigation fails', async () => {
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation failed')
            }) as any)
            await expect(browser.url('http://google.com')).rejects.toThrow('navigation failed')
        })
    })
})
