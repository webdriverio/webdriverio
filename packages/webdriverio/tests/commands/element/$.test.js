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
        const subElem = await elem.$('#subfoo')
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[1][0].body).toEqual({ using: 'id', value: 'foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/element')
        expect(request.mock.calls[2][0].body).toEqual({ using: 'id', value: 'subfoo' })
        expect(subElem.elementId).toBe('some-sub-elem-321')
    })

    afterEach(() => {
        request.mockClear()
    })
})
