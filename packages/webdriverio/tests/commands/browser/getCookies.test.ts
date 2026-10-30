import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, it, vi, afterEach, beforeEach, beforeAll, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'
import { getContextManager, setParallelContextStore } from '../../../src/session/context.js'

const parallelStore = new AsyncLocalStorage<string>()

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getCookies', () => {
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

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
        })

        it('should return all cookies', async () => {
            const cookies = await browser.getCookies()
            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('GET')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(cookies).toEqual([
                { name: 'cookie1', value: 'dummy-value-1' },
                { name: 'cookie2', value: 'dummy-value-2' },
                { name: 'cookie3', value: 'dummy-value-3' },
            ])
        })

        it('should reject a string filter', async () => {
            // @ts-expect-error removed string filter
            await expect(browser.getCookies('cookie1')).rejects.toThrow(
                'Passing a string or string array to `getCookies` was removed in WebdriverIO v10.'
            )
        })

        it('should reject a string array filter', async () => {
            // @ts-expect-error removed string array filter
            await expect(browser.getCookies(['cookie1', 'cookie3'])).rejects.toThrow(
                'Passing a string or string array to `getCookies` was removed in WebdriverIO v10.'
            )
        })

        it('should filter cookies by name', async () => {
            const cookies = await browser.getCookies({ name: 'cookie1' })

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('GET')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
        })

        it('should require all attributes in an object filter to match', async () => {
            vi.mocked(fetch).setMockResponse([[
                { name: 'session', value: 'matching', domain: 'webdriver.io' },
                { name: 'session', value: 'wrong-domain', domain: 'example.com' },
                { name: 'another', value: 'wrong-name', domain: 'webdriver.io' },
            ]])

            const cookies = await browser.getCookies({
                name: 'session',
                domain: 'webdriver.io'
            })

            expect(cookies).toEqual([
                { name: 'session', value: 'matching', domain: 'webdriver.io' }
            ])
        })

        it('should decode base64 values in an object filter', async () => {
            vi.mocked(fetch).setMockResponse([[
                { name: 'session', value: 'matching', domain: 'webdriver.io' },
            ]])

            const cookies = await browser.getCookies({
                name: 'session',
                value: { type: 'base64', value: btoa('matching') },
                domain: 'webdriver.io'
            })

            expect(cookies).toEqual([
                { name: 'session', value: 'matching', domain: 'webdriver.io' }
            ])
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-expect-error test invalid input
            await expect(browser.getCookies([2])).rejects.toThrow(
                'Passing a string or string array to `getCookies` was removed in WebdriverIO v10.'
            )
        })

        it('should not throw for an invalid cookie value filter', async () => {
            // @ts-expect-error test invalid input
            const cookies = await browser.getCookies({ value: null })
            expect(cookies).toEqual([])
        })

        afterEach(() => {
            vi.mocked(fetch).mockClear()
        })
    })

    describe('bidi', () => {
        let storageGetCookies: MockInstance

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })

            storageGetCookies =  vi.spyOn(browser, 'storageGetCookies')
            storageGetCookies.mockImplementation((() => ({
                cookies: [{
                    name: 'cookie',
                    value: {
                        type: 'base64',
                        value: btoa('hello world')
                    }
                }]
            }) as any))
            vi.spyOn(browser, 'getUrl').mockResolvedValue('https://webdriver.io')
            setParallelContextStore(parallelStore)
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
            storageGetCookies.mockClear()
        })

        const page = (url: string, userContext = 'uc-1') => vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
            contexts: [{ context: 'ctx-1', url, userContext, children: [] }]
        } as any)
        const cookie = (name: string, extra: Record<string, unknown>) => ({ name, value: { type: 'string', value: name }, path: '/', ...extra })
        const hostCookies = {
            cookies: [
                cookie('page', { domain: 'app.example.com' }),
                cookie('parent', { domain: '.example.com' }),
                cookie('other', { domain: 'other.example' })
            ]
        }

        it('should read the context partition on about:blank without classic fallback', async () => {
            page('about:blank')
            const getAllCookies = vi.spyOn(browser, 'getAllCookies')
            getAllCookies.mockClear()
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(getAllCookies).not.toBeCalled()
            // a page with no host has no cookies
            expect(cookies).toEqual([])
        })

        it('should read the jar of the test window and keep the cookies of the page host inside a parallel scope', async () => {
            const getTree = page('https://app.example.com/page')
            storageGetCookies.mockResolvedValueOnce(hostCookies)
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(getTree).toBeCalledWith({ root: 'ctx-1', maxDepth: 0 })
            expect(storageGetCookies).toBeCalledWith({ partition: { type: 'context', context: 'ctx-1' } })
            expect(cookies.map((c) => c.name)).toEqual(['page', 'parent'])
        })

        it('should read the BiDi partition of an explicit sourceOrigin in the user context of the window inside a parallel scope', async () => {
            page('https://app.example.com/page')
            storageGetCookies.mockResolvedValueOnce(hostCookies)
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies(undefined, 'https://other.example'))
            expect(storageGetCookies).toBeCalledWith({
                partition: { type: 'storageKey', sourceOrigin: 'https://other.example', userContext: 'uc-1' }
            })
            expect(cookies.map((c) => c.name)).toEqual(['page', 'parent', 'other'])
        })

        it('should use the page for an empty sourceOrigin inside a parallel scope', async () => {
            page('https://app.example.com/page')
            storageGetCookies.mockResolvedValueOnce(hostCookies)
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies(undefined, ''))
            expect(storageGetCookies).toBeCalledWith({ partition: { type: 'context', context: 'ctx-1' } })
            expect(cookies.map((c) => c.name)).toEqual(['page', 'parent'])
        })

        it('should keep only the cookies of the page path inside a parallel scope', async () => {
            page('https://app.example.com/page')
            storageGetCookies.mockResolvedValueOnce({ cookies: [
                cookie('root', { domain: 'app.example.com' }),
                cookie('exact', { domain: 'app.example.com', path: '/page' }),
                cookie('deeper', { domain: 'app.example.com', path: '/page/sub' }),
                cookie('prefix', { domain: 'app.example.com', path: '/pa' })
            ] })
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(cookies.map((c) => c.name)).toEqual(['root', 'exact'])
        })

        it('should not filter by secure, as WebDriver BiDi and Puppeteer', async () => {
            page('http://app.example.com/')
            storageGetCookies.mockResolvedValueOnce({ cookies: [cookie('plain', { domain: 'app.example.com' }), cookie('secure', { domain: 'app.example.com', secure: true })] })
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(cookies.map((c) => c.name)).toEqual(['plain', 'secure'])
        })

        it('should match a host-only cookie only on its own host inside a parallel scope', async () => {
            page('https://app.example.com/')
            storageGetCookies.mockResolvedValueOnce({ cookies: [
                cookie('parentHostOnly', { domain: 'example.com' }),
                cookie('parentDomain', { domain: '.example.com' })
            ] })
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(cookies.map((c) => c.name)).toEqual(['parentDomain'])
        })

        it('should match a domain cookie on an IP address host only by the same address', async () => {
            page('http://10.0.0.1/')
            storageGetCookies.mockResolvedValueOnce({ cookies: [
                cookie('same', { domain: '10.0.0.1' }),
                cookie('suffix', { domain: '.0.0.1' })
            ] })
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(cookies.map((c) => c.name)).toEqual(['same'])
        })

        it('should keep a partitioned cookie of the page host', async () => {
            page('https://app.example.com/')
            const partitioned = cookie('chips', { domain: 'app.example.com', 'goog:partitionKey': { topLevelSite: 'https://other.example' } })
            storageGetCookies.mockResolvedValueOnce({ cookies: [partitioned] })
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(cookies).toEqual([{ ...partitioned, value: 'chips' }])
        })

        it('should keep all cookies of the jar for a null sourceOrigin inside a parallel scope', async () => {
            const getTree = page('https://app.example.com/page')
            getTree.mockClear()
            storageGetCookies.mockResolvedValueOnce(hostCookies)
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies(undefined, null))
            expect(storageGetCookies).toBeCalledWith({ partition: { type: 'context', context: 'ctx-1' } })
            expect(getTree).not.toBeCalled()
            expect(cookies.map((c) => c.name)).toEqual(['page', 'parent', 'other'])
        })

        it('should not fall back to classic on an empty origin partition inside a parallel scope', async () => {
            page('https://app.example.com/page')
            storageGetCookies.mockResolvedValueOnce({ cookies: [] })
            const getAllCookies = vi.spyOn(browser, 'getAllCookies')
            getAllCookies.mockClear()
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(getAllCookies).not.toBeCalled()
            expect(cookies).toEqual([])
        })

        describe('with wdio:experimentalBiDiCommands', () => {
            beforeEach(() => {
                (browser as unknown as Record<string, unknown>).__bidiCommandsEnabled = true
                vi.spyOn(getContextManager(browser), 'getCurrentContext').mockResolvedValue('ctx-1')
            })

            afterEach(() => {
                (browser as unknown as Record<string, unknown>).__bidiCommandsEnabled = false
                vi.mocked(getContextManager(browser).getCurrentContext).mockRestore()
            })

            it('should read the jar of the current window and keep the cookies of the page host', async () => {
                page('https://app.example.com/page')
                storageGetCookies.mockResolvedValueOnce(hostCookies)
                const cookies = await browser.getCookies()
                expect(storageGetCookies).toBeCalledWith({ partition: { type: 'context', context: 'ctx-1' } })
                expect(cookies.map((c) => c.name)).toEqual(['page', 'parent'])
            })

            it('should not fall back to classic when BiDi fails', async () => {
                page('https://app.example.com/page')
                storageGetCookies.mockRejectedValueOnce(new Error('boom'))
                const getAllCookies = vi.spyOn(browser, 'getAllCookies')
                getAllCookies.mockClear()
                await expect(browser.getCookies()).rejects.toThrow('boom')
                expect(getAllCookies).not.toBeCalled()
            })
        })

        it('should return all cookies', async () => {
            const cookies = await browser.getCookies()
            expect(storageGetCookies).toBeCalledTimes(1)
            expect(storageGetCookies).toBeCalledWith({
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
            expect(cookies).toEqual([
                {
                    name: 'cookie',
                    value: 'hello world'
                }
            ])
        })

        afterEach(() => {
            vi.mocked(fetch).mockClear()
        })
    })
})
