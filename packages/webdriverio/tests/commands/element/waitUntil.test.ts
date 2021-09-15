// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

jest.setTimeout(10 * 1000)

describe('waitUntil', () => {
    let browser: WebdriverIO.Browser

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
