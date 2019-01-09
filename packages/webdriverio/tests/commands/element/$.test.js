import request from 'request'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

describe('element', () => {
    it('should fetch an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[1][0].body).toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/element')
        expect(request.mock.calls[2][0].body).toEqual({ using: 'css selector', value: '#subfoo' })
        expect(subElem.elementId).toBe('some-sub-elem-321')
        expect(subElem[ELEMENT_KEY]).toBe('some-sub-elem-321')
        expect(subElem.ELEMENT).toBe(undefined)
    })

    it('should fetch an element (no-w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        expect(elem[ELEMENT_KEY]).toBe(undefined)
        expect(elem.ELEMENT).toBe('some-elem-123')
        expect(subElem[ELEMENT_KEY]).toBe(undefined)
        expect(subElem.ELEMENT).toBe('some-sub-elem-321')
    })

    it('keeps prototype from browser object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                'appium-version': '1.9.2'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        expect(subElem.isMobile).toBe(true)
    })

    afterEach(() => {
        request.mockClear()
    })
})
