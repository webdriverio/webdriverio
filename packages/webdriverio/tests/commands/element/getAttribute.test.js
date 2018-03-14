import request from 'request'
import { remote } from '../../../src'

describe('getAttribute test', () => {
    let browser
    let elem

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
    })

    it('should allow to get attribute from element', async () => {
        await elem.getAttribute('foo')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/attribute/foo')
    })

    afterEach(() => {
        request.mockClear()
    })
})
