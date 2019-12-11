import request from 'request'
import { remote } from '../../../src'

describe('isEqual test', () => {
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
        request.mockClear()
    })

    it('should return true if isEqual', async () => {
        expect(await elem.isEqual(elem)).toBe(true)
    })

    it('should return false if are not isEqual', async () => {
        expect(await elem.isEqual(await browser.$$('#bar'))).toBe(false)
    })

    afterEach(() => {
        request.mockClear()
    })
})
