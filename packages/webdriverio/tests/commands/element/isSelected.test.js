import request from 'request'
import { remote } from '../../../src'

describe('isSelected test', () => {
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

    it('should allow to check if element is selected', async () => {
        await elem.isSelected()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/selected')
    })

    afterEach(() => {
        request.mockClear()
    })
})
