import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isExisting test', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to check if an element is enabled', async () => {
        const elem = await browser.$('#foo')
        await elem.isExisting()
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/elements')
    })

    it('should allow to check an react element', async () => {
        const elem = await browser.react$('#foo')
        await elem.isExisting()
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
    })

    it('should use getElementTagName if no selector is available', async () => {
        const elem = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'someId' })
        expect(await elem.isExisting()).toBe(true)
        expect(vi.mocked(got).mock.calls[0][0]!.pathname.endsWith('/element/someId/name')).toBe(true)

    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
