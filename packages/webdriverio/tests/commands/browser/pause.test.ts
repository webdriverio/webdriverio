// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'

jest.useFakeTimers()

describe('pause test', () => {
    let browser: WebdriverIO.BrowserObject
    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should pause for value provided as arg', async () => {
        browser.pause(500) // expect 500ms pause
        expect(setTimeout)
            .toHaveBeenLastCalledWith(expect.any(Function), 500)
    })

    it('should pause for default value', async () => {
        // @ts-ignore test invalid input
        browser.pause() // expect 1s pause
        expect(setTimeout)
            .toHaveBeenLastCalledWith(expect.any(Function), 1000)
    })

    afterEach(() => {
        got.mockClear()
    })
})
