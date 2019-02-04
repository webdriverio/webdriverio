import request from 'request'
import { remote } from '../../../src'

describe('setNextSessionCapabilities test', () => {
    let browser
    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foo'
            },
            onReload: true
        })
    })
    it('should be possible to pass capabilities object', async () => {
        browser.setNextSessionCapabilities({ browserName: 'bar' })
        await browser.reloadSession()

        expect(request.mock.calls[2][0].body.capabilities.alwaysMatch.browserName).toBe('bar')
    })

    it('should throw error if no capabilities passed', () => {
        expect(() => browser.setNextSessionCapabilities()).toThrowError(/Capabilities object is required/)
    })

    afterEach(() => {
        request.mockClear()
    })
})
