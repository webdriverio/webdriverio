import { expect, describe, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'

import { remote } from '../../../src/index.js'
import { ELEMENT_KEY } from '../../../src/constants.js'

vi.mock('got')

vi.mock('../../../src/commands/element/$$', () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => { })
}))

/**
 * Todo(Christian): make unit test work
 */
describe('shadow$$', () => {
    it('should find elements within a shadow root', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const elems = await elem.shadow$$('#subfoo')

        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/shadow')
        expect(vi.mocked(got).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/shadow/some-shadow-elem-123/elements')

        expect(elems[0].elementId).toBe('some-shadow-sub-elem-321')
        expect(elems[0][ELEMENT_KEY]).toBe('some-shadow-sub-elem-321')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('#subfoo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-sub-shadow-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-sub-shadow-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('#subfoo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-sub-shadow-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-sub-shadow-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('#subfoo')
        expect(elems[2].index).toBe(2)
    })
})
