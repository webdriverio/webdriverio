import path from 'node:path'
import { expect, describe, beforeEach, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'

import { remote } from '../../../src/index.js'
import { ELEMENT_KEY } from '../../../src/constants.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/commands/element/$.js', () => ({
    __esModule: true,
    $: vi.fn().mockImplementation(() => { })
}))

/**
 * Todo(Christian): make unit test work
 */
describe('shadow$', () => {
    beforeEach(() => {
        vi.mocked(got).mockClear()
    })

    it('should call $ with a function selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')
        const subElem = await el.shadow$('#shadowfoo')
        expect(subElem.elementId).toBe('some-shadow-sub-elem-321')
        expect(subElem[ELEMENT_KEY]).toBe('some-shadow-sub-elem-321')

        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/shadow')
        expect(vi.mocked(got).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/shadow/some-shadow-elem-123/element')
    })

    it('keeps prototype from browser object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true,
                'appium-version': '1.9.2'
            } as any
        })

        const el = await browser.$('#foo')
        const subElem = await el.shadow$('#shadowfoo')
        expect(subElem.isMobile).toBe(true)
    })

    it('fails back to JS for browser that dont have shadow support in WebDriver', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const errorResponse = { error: 'ups' }
        const el = await browser.$('#foo')
        got.setMockResponse([errorResponse, errorResponse, errorResponse, errorResponse])
        const mock: any = {
            $: vi.fn().mockReturnValue({ elem: 123 }),
            options: {},
            selector: 'foo',
        }
        mock.parent = { $: vi.fn().mockReturnValue({}) }
        mock.waitForExist = vi.fn().mockResolvedValue(mock)
        const elem = await el.shadow$.call(mock, '#shadowfoo')
        expect(elem).toEqual({ elem: 123 })

        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
    })
})
