// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('setValue', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        got.mockClear()
    })

    test('should set the value clearing the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/clear')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/value')
        expect(got.mock.calls[3][1].json.text).toEqual('foobar')
    })
})
