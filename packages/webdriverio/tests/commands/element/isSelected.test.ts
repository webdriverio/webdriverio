// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('isSelected test', () => {
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

    it('should allow to check if element is selected', async () => {
        await elem.isSelected()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/selected')
    })

    afterEach(() => {
        got.mockClear()
    })
})
