import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, it, beforeEach, beforeAll, afterEach, vi, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'
import { setParallelContextStore } from '../../../src/session/context.js'

const parallelStore = new AsyncLocalStorage<string>()

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('deleteCookies', () => {
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

        it('should delete all cookies', async () => {
            await browser.deleteCookies()

            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie' }),
                expect.objectContaining({ method: 'DELETE' })
            )
        })

        it('should support passing a string', async () => {
            await browser.deleteCookies('cookie1')

            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie/cookie1' }),
                expect.objectContaining({ method: 'DELETE' })
            )
        })

        it('should support passing a array with a string', async () => {
            await browser.deleteCookies(['cookie1'])

            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie/cookie1' }),
                expect.objectContaining({ method: 'DELETE' })
            )
        })

        it('should delete cookies that match by name', async () => {
            const cookieNames = ['cookie1', 'cookie2', 'cookie3']
            await browser.deleteCookies(cookieNames)

            cookieNames.forEach((name, i) => {
                expect(fetch).toHaveBeenNthCalledWith(
                    i + 1,
                    expect.objectContaining({ pathname: `/session/foobar-123/cookie/${name}` }),
                    expect.objectContaining({ method: 'DELETE' })
                )
            })
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-ignore test invalid input
            await expect(browser.deleteCookies([2]))
                .rejects
                .toEqual(new Error('Invalid value for cookie filter, expected \'string\' or \'remote.StorageCookieFilter\' but found "number"'))
        })

        it('should support remote.StorageCookieFilter in classic if name is used', async () => {
            await browser.deleteCookies([{ name: 'cookie123' }])

            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ pathname: '/session/foobar-123/cookie/cookie123' }),
                expect.objectContaining({ method: 'DELETE' })
            )
        })

        it('should throw if remote.StorageCookieFilter in classic is used with other value than name', async () => {
            await expect(browser.deleteCookies([{ domain: 'cookie123' }]))
                .rejects
                .toEqual(new Error('In WebDriver Classic you can only filter for cookie names'))
        })

        afterEach(() => {
            vi.mocked(fetch).mockClear()
        })
    })

    describe('bidi', () => {
        let storageDeleteCookies: MockInstance
        let storageGetCookies: MockInstance

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })
            storageDeleteCookies =  vi.spyOn(browser, 'storageDeleteCookies')
            storageDeleteCookies.mockImplementation((() => {}) as any)
            storageGetCookies = vi.spyOn(browser, 'storageGetCookies')
            storageGetCookies.mockReturnValue(Promise.resolve({ cookies: [{ name: 'foo', value: 'bar' }] }) as any)
            vi.spyOn(browser, 'getUrl').mockResolvedValue('https://webdriver.io')
        })

        beforeEach(() => {
            storageDeleteCookies.mockClear()
            storageGetCookies.mockClear()
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'ctx-1', url: 'https://webdriver.io/', userContext: 'uc-0', children: [] }]
            } as any)
            setParallelContextStore(parallelStore)
        })

        it('should not fall back to classic on empty match inside a parallel scope', async () => {
            storageGetCookies.mockResolvedValueOnce({ cookies: [] })
            const deleteAllCookies = vi.spyOn(browser, 'deleteAllCookies')
            const deleteCookie = vi.spyOn(browser, 'deleteCookie')
            deleteAllCookies.mockClear()
            deleteCookie.mockClear()
            await parallelStore.run('ctx-1', () => browser.deleteCookies('nope'))
            expect(storageGetCookies).toBeCalledWith({ partition: { type: 'context', context: 'ctx-1' }, filter: { name: 'nope' } })
            expect(storageDeleteCookies).not.toBeCalled()
            expect(deleteAllCookies).not.toBeCalled()
            expect(deleteCookie).not.toBeCalled()
        })

        // the jar of the window holds the cookies of every host: delete the cookies of the page, as WebDriver Classic
        it('should delete only the cookies of the page host inside a parallel scope', async () => {
            const getTree = vi.spyOn(browser, 'browsingContextGetTree')
            getTree.mockResolvedValue({
                contexts: [{ context: 'ctx-1', url: 'https://app.example.com/page', userContext: 'uc-1', children: [] }]
            } as any)
            storageGetCookies.mockResolvedValueOnce({
                cookies: [
                    { name: 'page', domain: 'app.example.com', path: '/' },
                    { name: 'parent', domain: '.example.com', path: '/' },
                    { name: 'other', domain: 'other.example', path: '/' }
                ]
            })
            await parallelStore.run('ctx-1', () => browser.deleteCookies())
            expect(getTree).toBeCalledWith({ root: 'ctx-1', maxDepth: 0 })
            const partition = { type: 'context', context: 'ctx-1' }
            expect(storageGetCookies).toBeCalledWith({ partition })
            expect(storageDeleteCookies.mock.calls).toEqual([
                [{ filter: { name: 'page', domain: 'app.example.com', path: '/' }, partition }],
                [{ filter: { name: 'parent', domain: '.example.com', path: '/' }, partition }]
            ])
        })

        it('should delete only the cookies of the page path and of a secure page inside a parallel scope', async () => {
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'ctx-1', url: 'http://app.example.com/page', userContext: 'uc-1', children: [] }]
            } as any)
            storageGetCookies.mockResolvedValueOnce({
                cookies: [
                    { name: 'root', domain: 'app.example.com', path: '/' },
                    { name: 'deeper', domain: 'app.example.com', path: '/page/sub' },
                    { name: 'secure', domain: 'app.example.com', path: '/', secure: true }
                ]
            })
            await parallelStore.run('ctx-1', () => browser.deleteCookies())
            expect(storageDeleteCookies.mock.calls).toEqual([
                [{ filter: { name: 'root', domain: 'app.example.com', path: '/' }, partition: { type: 'context', context: 'ctx-1' } }]
            ])
        })

        // WebDriver Classic: a page with no host has no associated cookies; the jar is shared with other tests
        it('should delete no cookie of the jar on a page with no host inside a parallel scope', async () => {
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'ctx-1', url: 'about:blank', userContext: 'uc-1', children: [] }]
            } as any)
            await parallelStore.run('ctx-1', () => browser.deleteCookies())
            expect(storageDeleteCookies).not.toBeCalled()
        })

        it('should delete all cookies', async () => {
            await browser.deleteCookies()
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should support passing a string', async () => {
            await browser.deleteCookies('cookie1')
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { name: 'cookie1' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should support passing an object', async () => {
            await browser.deleteCookies({ domain: 'foobar.com' })
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { domain: 'foobar.com' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should support passing a array with a string', async () => {
            await browser.deleteCookies(['cookie1', 'cookie2'])
            expect(storageDeleteCookies).toBeCalledTimes(2)
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { name: 'cookie1' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { name: 'cookie2' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should support passing an array of objects', async () => {
            await browser.deleteCookies([
                { domain: 'foobar.com' },
                { domain: 'foobar2.com' }
            ])
            expect(storageDeleteCookies).toBeCalledTimes(2)
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { domain: 'foobar.com' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
            expect(storageDeleteCookies).toBeCalledWith({
                filter: { domain: 'foobar2.com' },
                partition: {
                    type: 'storageKey',
                    sourceOrigin: 'https://webdriver.io'
                }
            })
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-ignore test invalid input
            await expect(browser.deleteCookies([2]))
                .rejects
                .toEqual(new Error('Invalid value for cookie filter, expected \'string\' or \'remote.StorageCookieFilter\' but found "number"'))
        })

        it('should fallback to classic if storageGetCookies returns empty', async () => {
            storageGetCookies.mockReturnValue(Promise.resolve({ cookies: [] }))
            const deleteAllCookies = vi.spyOn(browser, 'deleteAllCookies')
            deleteAllCookies.mockResolvedValue(null as any)

            await browser.deleteCookies()

            expect(deleteAllCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledTimes(0)
        })
    })
})
