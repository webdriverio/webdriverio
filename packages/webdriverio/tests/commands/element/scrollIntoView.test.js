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
        const executeCall = got.mock.calls[2][1]
        expect(executeCall.uri.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(Object.keys(executeCall.json.args[0])).toHaveLength(2)
        expect(elem.elementId.scrollIntoView.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        got.mockClear()
    })
})
