import path from 'node:path'
import { expect, describe, it, beforeEach, beforeAll, afterEach, vi, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'

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

            expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe('DELETE')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
        })

        it('should support passing a string', async () => {
            await browser.deleteCookies('cookie1')

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('DELETE')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie/cookie1')
        })

        it('should support passing a array with a string', async () => {
            await browser.deleteCookies(['cookie1'])

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('DELETE')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie/cookie1')
        })

        it('should delete cookies that match by name', async () => {
            const cookieNames = ['cookie1', 'cookie2', 'cookie3']
            await browser.deleteCookies(cookieNames)

            cookieNames.forEach((name, i) => {
                expect(vi.mocked(fetch).mock.calls[i][1]!.method).toBe('DELETE')
                // @ts-expect-error mock implementation
                expect(vi.mocked(fetch).mock.calls[i][0]!.pathname)
                    .toBe(`/session/foobar-123/cookie/${name}`)
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

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('DELETE')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie/cookie123')
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

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })
            storageDeleteCookies =  vi.spyOn(browser, 'storageDeleteCookies')
            storageDeleteCookies.mockImplementation((() => {}) as any)
        })

        beforeEach(() => {
            storageDeleteCookies.mockClear()
        })

        it('should delete all cookies', async () => {
            await browser.deleteCookies()
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({})
        })

        it('should support passing a string', async () => {
            await browser.deleteCookies('cookie1')
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({ filter: { name: 'cookie1' } })
        })

        it('should support passing an object', async () => {
            await browser.deleteCookies({ domain: 'foobar.com' })
            expect(storageDeleteCookies).toBeCalledTimes(1)
            expect(storageDeleteCookies).toBeCalledWith({ filter: { domain: 'foobar.com' } })
        })

        it('should support passing a array with a string', async () => {
            await browser.deleteCookies(['cookie1', 'cookie2'])
            expect(storageDeleteCookies).toBeCalledTimes(2)
            expect(storageDeleteCookies).toBeCalledWith({ filter: { name: 'cookie1' } })
            expect(storageDeleteCookies).toBeCalledWith({ filter: { name: 'cookie2' } })
        })

        it('should support passing an array of objects', async () => {
            await browser.deleteCookies([
                { domain: 'foobar.com' },
                { domain: 'foobar2.com' }
            ])
            expect(storageDeleteCookies).toBeCalledTimes(2)
            expect(storageDeleteCookies).toBeCalledWith({ filter: { domain: 'foobar.com' } })
            expect(storageDeleteCookies).toBeCalledWith({ filter: { domain: 'foobar2.com' } })
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-ignore test invalid input
            await expect(browser.deleteCookies([2]))
                .rejects
                .toEqual(new Error('Invalid value for cookie filter, expected \'string\' or \'remote.StorageCookieFilter\' but found "number"'))
        })
    })
})
