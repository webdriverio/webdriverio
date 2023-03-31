/**
 * @vitest-environment jsdom
 */
import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, afterAll, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
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
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(vi.mocked(got).mock.calls[2][1]!.json.args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    afterEach(() => {
        vi.mocked(got).mockReset()
    })

    afterAll(() => {
        vi.mocked(got).mockRestore()
    })
})
