import got from 'got'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

describe('prevSibling test', () => {
    it('should return previous sibling of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const elems = await elem.$$('#subfoo')
        expect(got.mock.calls[1][1].method).toBe('POST')
        expect(got.mock.calls[1][1].uri.pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[1][1].json)
            .toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(got.mock.calls[2][1].method).toBe('POST')
        expect(got.mock.calls[2][1].uri.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/elements')
        expect(got.mock.calls[2][1].json)
            .toEqual({ using: 'css selector', value: '#subfoo' })
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-sub-elem-321')
        expect(elems[0][ELEMENT_KEY]).toBe('some-sub-elem-321')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('#subfoo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('#subfoo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('#subfoo')
        expect(elems[2].index).toBe(2)
        expect(elems[1].prev().elementId).toBe('some-sub-elem-321')
    })
})