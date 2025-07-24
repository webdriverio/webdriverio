import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, beforeAll, beforeEach, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isStable test', () => {
    let browser: WebdriverIO.Browser
    let elem: any

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
    })

    beforeEach(() => {
        global.document = { visibilityState: 'visible' } as any
    })

    it('should allow to check if element is stable', async () => {
        await elem.isStable()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/async')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).script)
            .toEqual(expect.stringContaining('return (function isElementStable(elem, done) {'))
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).args)
            .toEqual([{
                ELEMENT: elem.elementId,
                [ELEMENT_KEY]: elem.elementId,
            }])
    })

    it('should throw if used on an inactive tab', async () => {
        global.document = { visibilityState: 'hidden' } as any
        await expect(elem.isStable()).rejects.toThrowError('You are checking for animations on an inactive tab, animations do not run for inactive tabs')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
