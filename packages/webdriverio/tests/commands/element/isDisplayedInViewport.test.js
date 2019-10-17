/**
 * @jest-environment jsdom
 */

import request from 'request'
import { remote } from '../../../src'

describe('isDisplayedInViewport test', () => {
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

    it('should allow to check if element is displayed', async () => {
        await elem.isDisplayedInViewport()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(request.mock.calls[2][0].body.args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    it('should return false if element can\'t be found after refetching it', async () => {
        const elem = await browser.$('#nonexisting')
        expect(await elem.isDisplayedInViewport()).toBe(false)
        expect(request).toBeCalledTimes(2)
    })

    afterEach(() => {
        request.mockClear()
    })
})
