import request from 'request'
import { remote } from '../../../src'

describe('getTagName test', () => {
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

    it('should allow to get the tag name of an element', async () => {
        await elem.getTagName()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/name')
    })

    afterEach(() => {
        request.mockClear()
    })
})
