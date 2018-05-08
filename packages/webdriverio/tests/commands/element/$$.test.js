import request from 'request'
import { remote } from '../../../src'

describe('element', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should fetch an element', async () => {
        const elem = await browser.$('#foo')
        const elems = await elem.$$('#subfoo')
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[1][0].body).toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/elements')
        expect(request.mock.calls[2][0].body).toEqual({ using: 'css selector', value: '#subfoo' })
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-sub-elem-321')
        expect(elems[0].selector).toBe('#subfoo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1].selector).toBe('#subfoo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2].selector).toBe('#subfoo')
        expect(elems[2].index).toBe(2)
    })

    afterEach(() => {
        request.mockClear()
    })
})
