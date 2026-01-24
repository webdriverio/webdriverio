import path from 'node:path'
import { expect, describe, it, vi, afterEach, beforeEach, beforeAll, type MockInstance } from 'vitest'
import { remote } from '../../../src/index.js'

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

        it('should support passing a string', async () => {
            const cookies = await browser.getCookies('cookie1')

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('GET')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
        })

        it('should support passing a array with strings', async () => {
            const cookies = await browser.getCookies(['cookie1'])

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('GET')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
        })

        it('should get all cookies and filter out cookies that match by name', async () => {
            const cookieNames = ['cookie1', 'doesn-not-exist', 'cookie3']
            const cookies = await browser.getCookies(cookieNames)

            expect(vi.mocked(fetch).mock.calls[0][1]!.method).toBe('GET')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(cookies).toEqual([
                { name: 'cookie1', value: 'dummy-value-1' },
                { name: 'cookie3', value: 'dummy-value-3' },
            ])
        })

        it('should throw error if invalid arguments are passed', async () => {
            // @ts-ignore test invalid input
            const cookies = await browser.getCookies([2])
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
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
            storageGetCookies.mockClear()
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
