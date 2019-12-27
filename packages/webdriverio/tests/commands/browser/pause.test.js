import request from 'request'
import { remote } from '../../../src'

describe('pause test', () => {
    let browser
    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should pause for value provided as arg', async () => {
        const start = Date.now()
        await browser.pause(500)
        const end = Date.now()

        expect((end - start) > 490).toBe(true)
        expect((end - start) < 590).toBe(true)
        expect(request.mock.calls).toHaveLength(1)
    })

    it('should pause for default value', async () => {
        const start = Date.now()
        await browser.pause()
        const end = Date.now()

        expect((end - start) > 990).toBe(true)
        expect((end - start) < 1090).toBe(true)
        expect(request.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        request.mockClear()
    })
})
