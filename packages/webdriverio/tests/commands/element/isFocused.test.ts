/**
 * @jest-environment jsdom
 */

// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('isFocused test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

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
        expect(await elem.isFocused()).toBe(true)
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
