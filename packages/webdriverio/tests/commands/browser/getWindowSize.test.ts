import path from 'node:path'
import { expect, describe, it, vi, beforeAll, afterEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
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
        expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe('GET')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/window/rect')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
