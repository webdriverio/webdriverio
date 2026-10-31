import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, beforeEach, beforeAll, afterEach, it, vi, type MockInstance } from 'vitest'

import { remote } from '../../../src/index.js'
import { getContextManager, setParallelContextStore } from '../../../src/session/context.js'

const parallelStore = new AsyncLocalStorage<string>()

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setCookies', () => {
    const cookie1 = { name: 'cookie1', value: 'dummy-value-1' }
    const cookie2 = { name: 'cookie2', value: 'dummy-value-2' }
    const cookie3 = { name: 'cookie2', value: 'dummy-value-3' }
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

        it('should output the expected format', async () => {
            await browser.setCookies([cookie1])
            expect(fetch).toHaveBeenCalledTimes(1)
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': cookie1 }) })
            )
        })

        it('should support passing an object', async () => {
            await browser.setCookies(cookie1)
            expect(fetch).toHaveBeenCalledTimes(1)
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': cookie1 }) })
            )
        })

        it('can be called multiple times', async () => {
            await browser.setCookies(cookie1)
            await browser.setCookies(cookie2)
            expect(fetch).toHaveBeenCalledTimes(2)
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': cookie1 }) })
            )
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': cookie2 }) })
            )
        })

        it('should work with multiple objects passed', async () => {
            const cookies = [cookie1, cookie2, cookie3]
            await browser.setCookies(cookies)

            cookies.forEach((cookie, i) => {
                expect(fetch).toHaveBeenNthCalledWith(
                    i + 1,
                    expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                    expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': cookie }) })
                )
            })
        })

        // WebDriver Classic only accepts "Strict" / "Lax" / "None" and has no "default"
        it.each([
            ['strict', { sameSite: 'Strict' }],
            ['Lax', { sameSite: 'Lax' }],
            ['none', { sameSite: 'None' }],
            ['default', {}]
        ])('should send sameSite %s to WebDriver Classic in its own case', async (sameSite, expected) => {
            await browser.setCookies({ ...cookie1, sameSite: sameSite as never })
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ 'cookie': { ...cookie1, ...expected } }) })
            )
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-ignore test invalid parameter
            await expect(browser.setCookies([2]))
                .rejects
                .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies for documentation)'))
        })

        it('should throw the input error for a null cookie', async () => {
            await expect(browser.setCookies([null as never]))
                .rejects
                .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies for documentation)'))
            expect(fetch).not.toHaveBeenCalled()
        })

        afterEach(() => {
            vi.mocked(fetch).mockClear()
        })
    })

    describe('bidi', () => {
        let storageSetCookie: MockInstance

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })

            storageSetCookie =  vi.spyOn(browser, 'storageSetCookie')
            storageSetCookie.mockImplementation((() => {}) as any)
            vi.spyOn(browser, 'getUrl').mockResolvedValue('https://webdriver.io')
        })

        beforeEach(() => {
            storageSetCookie.mockClear()
            setParallelContextStore(parallelStore)
        })

        const page = (url: string) => vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
            contexts: [{ context: 'ctx-1', url, userContext: 'uc-1', children: [] }]
        } as any)

        // Chrome rejects a cookie that is not secure in a sourceOrigin (CHIPS) partition
        it('should set the cookie in the jar of the test window inside a parallel scope', async () => {
            const getUrl = vi.spyOn(browser, 'getUrl')
            getUrl.mockClear()
            const getTree = page('https://webdriver.io/')
            getTree.mockClear()
            await parallelStore.run('ctx-1', () => browser.setCookies(cookie1))
            expect(storageSetCookie).toBeCalledWith({
                cookie: { name: 'cookie1', domain: 'webdriver.io', value: { type: 'string', value: cookie1.value } },
                partition: { type: 'context', context: 'ctx-1' }
            })
            expect(getTree).toBeCalledTimes(1)
            expect(getUrl).not.toBeCalled()
        })

        it('should send an explicit domain as given inside a parallel scope', async () => {
            const getTree = page('https://webdriver.io/')
            getTree.mockClear()
            await parallelStore.run('ctx-1', () => browser.setCookies({ ...cookie1, domain: 'example.com' }))
            expect(storageSetCookie.mock.calls[0][0].cookie.domain).toBe('example.com')
            expect(getTree).not.toBeCalled()
        })

        it('should not set a cookie without a domain on a page with no host inside a parallel scope', async () => {
            page('about:blank')
            await expect(parallelStore.run('ctx-1', () => browser.setCookies(cookie1)))
                .rejects.toThrow('the page has no host')
            expect(storageSetCookie).not.toBeCalled()
        })

        // WebDriver BiDi only accepts lowercase values
        it.each([
            ['inside a parallel scope', (fn: () => Promise<unknown>) => parallelStore.run('ctx-1', fn)],
            ['in a sequential run', (fn: () => Promise<unknown>) => fn()]
        ])('should send sameSite in lowercase to BiDi %s', async (_, run) => {
            page('https://webdriver.io/')
            storageSetCookie.mockClear()
            await run(() => browser.setCookies({ ...cookie1, sameSite: 'Strict' }))
            expect(storageSetCookie.mock.calls[0][0].cookie.sameSite).toBe('strict')
        })

        it('should send sameSite in its own case to the WebDriver Classic fallback', async () => {
            const addCookie = vi.spyOn(browser, 'addCookie')
            addCookie.mockClear()
            addCookie.mockResolvedValue(undefined as never)
            storageSetCookie.mockRejectedValueOnce(new Error('bidi boom'))
            await browser.setCookies({ ...cookie1, sameSite: 'strict' })
            expect(addCookie).toBeCalledWith({ ...cookie1, sameSite: 'Strict' })
        })

        it('should propagate BiDi errors inside a parallel scope without addCookie', async () => {
            const addCookie = vi.spyOn(browser, 'addCookie')
            addCookie.mockClear()
            page('https://webdriver.io/')
            storageSetCookie.mockRejectedValueOnce(new Error('bidi boom'))
            await expect(parallelStore.run('ctx-1', () => browser.setCookies(cookie1)))
                .rejects.toThrow('bidi boom')
            expect(addCookie).not.toBeCalled()
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

            it('should set the cookie in the jar of the current window without addCookie', async () => {
                page('https://webdriver.io/')
                const addCookie = vi.spyOn(browser, 'addCookie')
                addCookie.mockClear()
                storageSetCookie.mockRejectedValueOnce(new Error('bidi boom'))
                await expect(browser.setCookies(cookie1)).rejects.toThrow('bidi boom')
                expect(storageSetCookie).toBeCalledWith({
                    cookie: { name: 'cookie1', domain: 'webdriver.io', value: { type: 'string', value: cookie1.value } },
                    partition: { type: 'context', context: 'ctx-1' }
                })
                expect(addCookie).not.toBeCalled()
            })
        })

        it('should support passing an array', async () => {
            await browser.setCookies([cookie1])
            expect(storageSetCookie).toBeCalledTimes(1)
            expect(storageSetCookie).toBeCalledWith({
                cookie: {
                    domain: 'webdriver.io',
                    name: 'cookie1',
                    value: {
                        type: 'string',
                        value: cookie1.value
                    }
                },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should support passing an object', async () => {
            await browser.setCookies(cookie1)
            expect(storageSetCookie).toBeCalledTimes(1)
            expect(storageSetCookie).toBeCalledWith({
                cookie: {
                    domain: 'webdriver.io',
                    name: 'cookie1',
                    value: {
                        type: 'string',
                        value: cookie1.value
                    }
                },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('can be called multiple times', async () => {
            await browser.setCookies([cookie1, cookie2, cookie3])
            expect(storageSetCookie).toBeCalledTimes(3)
        })
    })
})
