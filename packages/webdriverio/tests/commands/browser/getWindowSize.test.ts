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
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: '/session/foobar-123/window/rect' }),
            expect.objectContaining({ method: 'GET' })
        )
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
