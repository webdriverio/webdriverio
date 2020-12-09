// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('scrollIntoView test', () => {
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

    it('should allow to check if an element is enabled', async () => {
        // @ts-ignore mock feature
        elem.elementId = { scrollIntoView: jest.fn() }
        await elem.scrollIntoView()
        const executeCallUrl = got.mock.calls[2][0]
        const executeCallOptions = got.mock.calls[2][1]
        expect(executeCallUrl.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(Object.keys(executeCallOptions.json.args[0])).toHaveLength(2)
        // @ts-ignore mock feature
        expect(elem.elementId.scrollIntoView.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        got.mockClear()
    })
})
