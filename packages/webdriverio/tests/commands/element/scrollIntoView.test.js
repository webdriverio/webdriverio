import got from 'got'
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
        const executeCallUrl = got.mock.calls[2][0]
        const executeCallOptions = got.mock.calls[2][1]
        expect(executeCallUrl.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(Object.keys(executeCallOptions.json.args[0])).toHaveLength(2)
        expect(elem.elementId.scrollIntoView.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        got.mockClear()
    })
})
