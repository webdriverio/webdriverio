import got from 'got'
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
        expect(got.mock.calls[1][1].method).toBe('POST')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[1][1].json)
            .toEqual({ using: 'css selector', value: '#foo' })
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
        expect(got.mock.calls[2][1].method).toBe('POST')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json)
            .toEqual({ using: 'css selector', value: '#subfoo' })
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
        expect(elem.ELEMENT).toBe('some-elem-123')
        expect(subElem.ELEMENT).toBe('some-sub-elem-321')
    })

    it('should allow to transform protocol reference into a WebdriverIO element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$({ [ELEMENT_KEY]: 'foobar' })
        expect(subElem.elementId).toBe('foobar')
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
        got.mockClear()
    })
})
