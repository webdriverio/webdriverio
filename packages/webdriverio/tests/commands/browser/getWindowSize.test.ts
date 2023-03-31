import path from 'node:path'
import { expect, describe, it, vi, beforeAll, afterEach } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getWindowSize', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should get size of W3C browser window', async () => {
        await browser.getWindowSize()
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/window/rect')
    })

    it('should get size of NO-W3C browser window', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.getWindowSize()
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/window/current/size')
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
