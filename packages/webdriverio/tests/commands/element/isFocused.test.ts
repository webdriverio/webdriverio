/**
 * @vitest-environment jsdom
 */
import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, afterAll, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isFocused test', () => {
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

    it('should allow to check if element is displayed', async () => {
        expect(await elem.isFocused()).toBe(true)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockReset()
    })

    afterAll(() => {
        vi.mocked(fetch).mockRestore()
    })
})
