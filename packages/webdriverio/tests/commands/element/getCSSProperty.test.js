import request from 'request'
import { remote } from '../../../src'

describe('getCSSProperty test', () => {
    it('should allow to get the css property of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('width')

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/css/width')
        expect(property.value).toBe('1250px')
        expect(property.parsed.value).toBe(1250)
    })

    afterEach(() => {
        request.mockClear()
    })
})
