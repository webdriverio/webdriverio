import path from 'node:path'
import { expect, describe, beforeAll, afterEach, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setCookies', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should output the expected format', async () => {
        await browser.setCookies([{ name: 'cookie1', value: 'dummy-value-1' }])
        expect(vi.mocked(got).mock.calls).toHaveLength(2!)
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
    })

    it('should support passing an object', async () => {
        await browser.setCookies({ name: 'cookie1', value: 'dummy-value-1' })
        expect(vi.mocked(got).mock.calls).toHaveLength(1!)
        expect(vi.mocked(got).mock.calls[0][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(vi.mocked(got).mock.calls[0][1]!.json)
            .toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
    })

    it('can be called multiple times', async () => {
        await browser.setCookies({ name: 'cookie1', value: 'dummy-value-1' })
        await browser.setCookies({ name: 'cookie2', value: 'dummy-value-1' })
        expect(vi.mocked(got).mock.calls).toHaveLength(2!)
        expect(vi.mocked(got).mock.calls[0][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(vi.mocked(got).mock.calls[0][1]!.json)
            .toEqual({ 'cookie': { name: 'cookie1', value: 'dummy-value-1' } })
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('POST')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/cookie')
        expect(vi.mocked(got).mock.calls[1][1]!.json)
            .toEqual({ 'cookie': { name: 'cookie2', value: 'dummy-value-1' } })
    })

    it('should work with multiple objects passed', async () => {
        const cookies = [
            { name: 'cookie1', value: 'dummy-value-1' },
            { name: 'cookie2', value: 'dummy-value-2' },
            { name: 'cookie3', value: 'dummy-value-3' }
        ]

        await browser.setCookies(cookies)

        cookies.forEach((cookie, i) => {
            expect(vi.mocked(got).mock.calls[i][1]!.method).toBe('POST')
            expect(vi.mocked(got).mock.calls[i][0]!.pathname)
                .toBe('/session/foobar-123/cookie')
            expect(vi.mocked(got).mock.calls[i][1]!.json)
                .toEqual({ 'cookie': cookie })
        })
    })

    it('should throw error if invalid arguments are passed', async () => {
        // @ts-ignore test invalid parameter
        await expect(browser.setCookies([2]))
            .rejects
            .toEqual(new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies for documentation)'))
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
