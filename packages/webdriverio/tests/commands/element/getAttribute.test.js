import got from 'got'
import { remote } from '../../../src'

describe('getAttribute test', () => {
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

    it('should allow to get attribute from element', async () => {
        await elem.getAttribute('foo')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/attribute/foo')
    })

    afterEach(() => {
        got.mockClear()
    })
})
