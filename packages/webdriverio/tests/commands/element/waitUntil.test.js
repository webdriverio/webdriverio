import got from 'got'
import { remote } from '../../../src'

jest.setTimeout(10 * 1000)

describe('waitUntil', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('Should throw an error if an invalid condition is used', async () => {
        const el = await browser.$('foo')
        const result = await el.waitUntil(async () => true)
        expect(result).toBe(true)
    })

    afterEach(() => {
        got.mockClear()
    })
})
