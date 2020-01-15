import got from 'got'
import { remote } from '../../../src'

describe('isExisting test', () => {
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
        await elem.isExisting()
        expect(got.mock.calls[2][1].uri.pathname)
            .toBe('/session/foobar-123/elements')
    })

    afterEach(() => {
        got.mockClear()
    })
})
