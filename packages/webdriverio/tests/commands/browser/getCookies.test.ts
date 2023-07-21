import path from 'node:path'
import { expect, describe, it, vi, afterEach, beforeAll } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getCookies', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should return all cookies', async () => {
        const cookies = await browser.getCookies()

        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(cookies).toEqual([
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ])
    })

    it('should support passing a string', async () => {
        const cookies = await browser.getCookies('cookie1')

        expect(vi.mocked(got).mock.calls[0][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
    })

    it('should support passing a array with strings', async () => {
        const cookies = await browser.getCookies(['cookie1'])

        expect(vi.mocked(got).mock.calls[0][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(cookies).toEqual([{ name: 'cookie1', value: 'dummy-value-1' }])
    })

    it('should get all cookies and filter out cookies that match by name', async () => {
        const cookieNames = ['cookie1', 'doesn-not-exist', 'cookie3']
        const cookies = await browser.getCookies(cookieNames)

        expect(vi.mocked(got).mock.calls[0][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(cookies).toEqual([
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie3', value: 'dummy-value-3' },
        ])
    })

    it('should throw error if invalid arguments are passed', async () => {
        // @ts-ignore test invalid input
        await expect(browser.getCookies([2]))
            .rejects
            .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/getCookies for documentation)'))
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
