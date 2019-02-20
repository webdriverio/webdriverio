import request from 'request'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

describe('elements', () => {
    it('should fetch elements', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.$$('.foo')
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/elements')
        expect(request.mock.calls[1][0].body).toEqual({ using: 'css selector', value: '.foo' })
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0][ELEMENT_KEY]).toBe('some-elem-123')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('.foo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('.foo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('.foo')
        expect(elems[2].index).toBe(2)
    })

    it('should fetch elements (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elems = await browser.$$('.foo')
        expect(elems).toHaveLength(3)
        expect(elems[0][ELEMENT_KEY]).toBe(undefined)
        expect(elems[0].ELEMENT).toBe('some-elem-123')
        expect(elems[1][ELEMENT_KEY]).toBe(undefined)
        expect(elems[1].ELEMENT).toBe('some-elem-456')
        expect(elems[2][ELEMENT_KEY]).toBe(undefined)
        expect(elems[2].ELEMENT).toBe('some-elem-789')
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

        const elems = await browser.$$('.foo')
        expect(elems[0].isMobile).toBe(true)
        expect(elems[1].isMobile).toBe(true)
        expect(elems[2].isMobile).toBe(true)
    })

    afterEach(() => {
        request.mockClear()
    })
})
