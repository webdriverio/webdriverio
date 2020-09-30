import got from 'got'
import { remote } from '../../../src'

describe('clearValue test', () => {
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

    it('should allow to clear an input element', async () => {
        await elem.clearValue()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/clear')
    })

    afterEach(() => {
        got.mockClear()
    })
})
