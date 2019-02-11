import { remote } from '../../../src'
import request from 'request'

describe('shadowRoot', () => {
    it('should return an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')
        const subElem = await el.shadowRoot('#subfoo')
        expect(subElem.elementId).toBe('some-sub-elem-321')
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
        const subElem = await elem.shadowRoot('#subfoo')
        expect(subElem.$).not.toEqual(undefined)
    })

    afterEach(() => {
        request.mockClear()
    })

})
