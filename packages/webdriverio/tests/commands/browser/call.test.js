import { remote } from '../../../src'

describe('call command', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should call a fn and return result', () => {
        const callFn = jest.fn(() => true)
        const result = browser.call(callFn)
        expect(callFn).toBeCalled()
        expect(result).toEqual(true)
    })

    it('should not fail if nothing is applied', () => {
        browser.call()
    })
})
