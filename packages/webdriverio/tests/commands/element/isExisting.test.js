import got from 'got'
import { remote } from '../../../src'

describe('isExisting test', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to check if an element is enabled', async () => {
        const elem = await browser.$('#foo')
        await elem.isExisting()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/elements')
    })

    it('should allow to check an react element', async () => {
        const elem = await browser.react$('#foo')
        await elem.isExisting()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
    })

    afterEach(() => {
        got.mockClear()
    })
})
