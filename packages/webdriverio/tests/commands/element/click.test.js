import request from 'request'
import { remote } from '../../../src'

describe('click test', () => {
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

    it('should allow to click on an element', async () => {
        await elem.click()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/click')
    })

    afterEach(() => {
        request.mockClear()
    })
})
