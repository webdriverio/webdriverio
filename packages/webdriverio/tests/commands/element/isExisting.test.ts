import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
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
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ pathname: '/session/foobar-123/elements' }),
            expect.anything()
        )
    })

    it('should allow to check an react element', async () => {
        const elem = await browser.react$('#foo')
        await elem.isExisting()
        expect(fetch).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({ pathname: '/session/foobar-123/execute/sync' }),
            expect.anything()
        )
    })

    it('should use getElementTagName if no selector is available', async () => {
        const elem = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'someId' })
        expect(await elem.isExisting()).toBe(true)
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: expect.stringMatching(/\/element\/someId\/name$/) }),
            expect.anything()
        )
    })

    it('should use findElement (single) on mobile', async () => {
        const mobileBrowser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'iOS'
            }
        })
        const elem = await mobileBrowser.$('#foo')

        // clear the mock so we only assert isExisting's own request,
        // not the findElement from $('#foo') above
        vi.mocked(fetch).mockClear()

        await elem.isExisting()
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
            expect.toSatisfy((url: URL | string) => url.toString().endsWith('/element')),
            expect.any(Object)
        )
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
