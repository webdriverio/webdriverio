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

    it('should call a fn', () => {
        const callFn = jest.fn()
        browser.call(callFn)
        expect(callFn).toBeCalled()
    })

    it('should not fail if nothing is applied', () => {
        browser.call()
    })
})
