/**
 * @jest-environment jsdom
 */

import got from 'got'
import { remote } from '../../../src'

describe('isFocused test', () => {
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
        await elem.isFocused()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(got.mock.calls[2][1].json.args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    afterEach(() => {
        got.mockReset()
    })

    afterAll(() => {
        got.mockRestore()
    })
})
