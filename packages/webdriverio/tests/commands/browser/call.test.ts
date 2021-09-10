import { remote } from '../../../src'

describe('call command', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should call a fn and return result', async () => {
        const callFn = jest.fn(() => Promise.resolve(true))
        const result = await browser.call(callFn)
        expect(callFn).toBeCalled()
        expect(result).toEqual(true)
    })

    it('should not fail if nothing is applied', () => {
        // @ts-ignore test invalid param
        expect(() => browser.call())
            .toThrow(/needs to be a function/)
    })

    it('should fail if parameter is not a function', () => {
        // @ts-ignore test invalid param
        expect(() => browser.call(123))
            .toThrow(/needs to be a function/)
    })
})
