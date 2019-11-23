import request from 'request'
import { remote } from '../../../src'

describe('equals test', () => {
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

    it('should return true if equals', async () => {
        expect(await elem.equals(elem)).toBe(true)
    })

    it('should return false if are not equals', async () => {
        expect(await elem.equals(await browser.$$('#bar'))).toBe(false)
    })

    afterEach(() => {
        request.mockClear()
    })
})
