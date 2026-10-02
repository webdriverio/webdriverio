import path from 'node:path'
import { expect, describe, it, beforeAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

import { remote } from '../../../src/index.js'
import { getNetworkManager } from '../../../src/session/networkManager.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/session/networkManager.js', () => {
    const networkManagerMock = {
        getPendingRequests: vi.fn().mockReturnValue([]),
        initialize: vi.fn(),
        getRequestResponseData: vi.fn().mockResolvedValue({
            some: 'request'
        })
    }
    return {
        getNetworkManager: vi.fn().mockReturnValue(networkManagerMock)
    }
})

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
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/url' }),
                expect.objectContaining({ body: JSON.stringify({ url: 'http://google.com/' }) })
            )
        })

        it('should accept a relative url', async () => {
            await browser.url('/foobar')
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.anything(),
                expect.objectContaining({ body: JSON.stringify({ url: 'http://foobar.com/foobar' }) })
            )
        })

        it('returns a context that runs shared commands on the browser', async () => {
            const page = await browser.url('http://google.com')
            expect(page.url).toBe('http://google.com/')
            expect(page.isFrame).toBe(false)
            expect(page.parent).toBeUndefined()
            expect(page.contextId).toBeUndefined()
            expect(page.browser).toBe(browser)

            const getTitle = vi.spyOn(browser, 'getTitle').mockResolvedValue('Google')
            await expect(page.getTitle()).resolves.toBe('Google')
            expect(getTitle.mock.contexts[0]).toBe(browser)
        })

        it('updates url when getUrl reads the current one, like a BiDi context', async () => {
            const page = await browser.url('http://google.com')
            vi.spyOn(browser, 'getUrl').mockResolvedValue('http://google.com/redirected')
            await expect(page.getUrl()).resolves.toBe('http://google.com/redirected')
            expect(page.url).toBe('http://google.com/redirected')
        })

        it('rejects BiDi-only commands with the Classic alternative', async () => {
            const page = await browser.url('http://google.com')
            await expect(page.frame('iframe')).rejects.toThrow(/`frame\(\)` needs a WebDriver BiDi session[\s\S]*browser\.switchFrame\(\)/)
            await expect(page.navigate('/foo')).rejects.toThrow(/`navigate\(\)` needs a WebDriver BiDi session[\s\S]*browser\.url\(\)/)
            await expect(page.activate()).rejects.toThrow(/`activate\(\)` needs a WebDriver BiDi session[\s\S]*browser\.switchWindow\(\)/)
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
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                expect.anything(),
                expect.objectContaining({ body: JSON.stringify({ url: 'http://foobar/' }) })
            )
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
        let networkManager: any

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
            networkManager = getNetworkManager(browser)
        })

        beforeEach(() => {
            browsingContextNavigate.mockClear()
            url.mockClear()
            addInitScript.mockClear()
            mock.mockClear()
            mockMock.requestOnce.mockClear()
            mockMock.restore.mockClear()
            networkManager.getPendingRequests.mockClear()
            networkManager.getRequestResponseData.mockClear()
        })

        it('should use browsingContextNavigate', async () => {
            const req = await browser.url('http://google.com')
            expect(browsingContextNavigate).toBeCalledTimes(1)
            expect(browsingContextNavigate).toBeCalledWith({
                context: { context: '123' },
                url: 'http://google.com/',
                wait: 'complete'
            })
            expect(req?.request).toEqual({ some: 'request' })
            expect(req?.contextId).toBe('123')
            expect(req?.isFrame).toBe(false)
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

        it('should wait for network idle using navigation ID', async () => {
            // Restore implementation for success
            browsingContextNavigate.mockImplementation((async () => ({
                navigation: 'nav-123'
            })) as any)

            await browser.url('http://google.com', { wait: 'networkIdle' })

            expect(networkManager.getPendingRequests).toBeCalledWith('nav-123')
            expect(browsingContextNavigate).toBeCalledWith(expect.objectContaining({
                wait: 'complete' // Default fallback for networkIdle in browsingContextNavigate
            }))
        })

        it('should skip network idle wait when navigation id is null', async () => {
            browsingContextNavigate.mockImplementation((async () => ({
                navigation: null
            })) as any)

            const page = await browser.url('http://google.com', { wait: 'networkIdle' })
            expect(page?.request).toBeUndefined()
            expect(page?.contextId).toBe('123')
            expect(networkManager.getPendingRequests).not.toHaveBeenCalled()
            expect(networkManager.getRequestResponseData).not.toHaveBeenCalled()
        })

        it('should remove preload script when navigation falls back to classic', async () => {
            const remove = vi.fn()
            addInitScript.mockResolvedValue({ remove } as any)
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation canceled by concurrent navigation')
            }) as any)

            const page = await browser.url('http://google.com', {
                onBeforeLoad: () => {
                    console.log('onBeforeLoad')
                }
            })
            expect(page?.request).toBeUndefined()

            expect(addInitScript).toBeCalledTimes(1)
            expect(remove).toHaveBeenCalledTimes(1)
        })

        it('should remove preload script when navigation fails', async () => {
            const remove = vi.fn()
            addInitScript.mockResolvedValue({ remove } as any)
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation failed')
            }) as any)

            await expect(browser.url('http://google.com', {
                onBeforeLoad: () => {
                    console.log('onBeforeLoad')
                }
            })).rejects.toThrow('navigation failed')

            expect(remove).toHaveBeenCalledTimes(1)
        })

        it('should preserve the navigation error when preload cleanup also fails', async () => {
            const remove = vi.fn().mockRejectedValue(new Error('script.removePreloadScript'))
            addInitScript.mockResolvedValue({ remove } as any)
            browsingContextNavigate.mockImplementation((async () => {
                throw new Error('navigation failed')
            }) as any)

            await expect(browser.url('http://google.com', {
                onBeforeLoad: () => {
                    console.log('onBeforeLoad')
                }
            })).rejects.toThrow('navigation failed')

            expect(remove).toHaveBeenCalledTimes(1)
        })
    })
})
