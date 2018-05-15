import request from 'request'
import { remote } from '../../../src'

describe('scrollIntoView test', () => {
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

    it('should allow to check if an element is enabled', async () => {
        elem.elementId = { scrollIntoView: jest.fn() }
        await elem.scrollIntoView()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(elem.elementId.scrollIntoView.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        request.mockClear()
    })
})
