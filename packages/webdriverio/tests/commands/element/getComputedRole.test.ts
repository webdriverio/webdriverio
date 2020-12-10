// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('getAttribute test', () => {
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
    })

    it('should allow to get attribute from element', async () => {
        await elem.getComputedRole()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/computedrole')
    })

    afterEach(() => {
        got.mockClear()
    })
})
