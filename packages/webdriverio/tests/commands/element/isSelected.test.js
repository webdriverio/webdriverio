import got from 'got'
import { remote } from '../../../src'

describe('isSelected test', () => {
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

    it('should allow to check if element is selected', async () => {
        await elem.isSelected()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/selected')
    })

    afterEach(() => {
        got.mockClear()
    })
})
