// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('isClickable test', () => {
    let browser: WebdriverIO.BrowserObject
    let elem: WebdriverIO.Element

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
        got.mockClear()
    })

    it('should allow to check if element is displayed', async () => {
        await elem.isClickable()
        expect(got.mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(got.mock.calls[1][1].json.args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    it('should return false if element can\'t be found after refetching it', async () => {
        const elem = await browser.$('#nonexisting')
        expect(await elem.isClickable()).toBe(false)
        expect(got).toBeCalledTimes(2)
    })

    afterEach(() => {
        got.mockClear()
    })
})
