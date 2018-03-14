import request from 'request'
import { remote } from '../../../src'

describe('getText test', () => {
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

    it('should allow to get the text of an element', async () => {
        await elem.getText()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/text')
    })

    afterEach(() => {
        request.mockClear()
    })
})
