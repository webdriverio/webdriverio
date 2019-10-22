import request from 'request'
import { remote } from '../../../src'

describe('isClickable test', () => {
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
        request.mockClear()
    })

    it('should allow to check if element is displayed', async () => {
        await elem.isClickable()
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/displayed')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(request.mock.calls[1][0].body.args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    it('should return false if element can\'t be found after refetching it', async () => {
        const elem = await browser.$('#nonexisting')
        expect(await elem.isClickable()).toBe(false)
        expect(request).toBeCalledTimes(2)
    })

    afterEach(() => {
        request.mockClear()
    })
})
