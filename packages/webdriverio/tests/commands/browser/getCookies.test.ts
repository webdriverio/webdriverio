import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, it, vi, afterEach, beforeEach, beforeAll, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'
import { setParallelContextStore } from '../../../src/session/context.js'

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

        it('should read the context partition on about:blank without classic fallback', async () => {
            const getUrl = vi.spyOn(browser, 'getUrl')
            getUrl.mockClear()
            getUrl.mockResolvedValue('about:blank')
            const getAllCookies = vi.spyOn(browser, 'getAllCookies')
            getAllCookies.mockClear()
            const cookies = await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(storageGetCookies).toBeCalledWith({
                partition: { type: 'context', context: 'ctx-1' }
            })
            expect(getAllCookies).not.toBeCalled()
            getUrl.mockResolvedValue('https://webdriver.io')
            expect(cookies).toEqual([{ name: 'cookie', value: 'hello world' }])
        })

        it('should use the context partition inside a parallel scope', async () => {
            await parallelStore.run('ctx-1', () => browser.getCookies())
            expect(storageGetCookies).toBeCalledWith({
                partition: { type: 'context', context: 'ctx-1' }
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
