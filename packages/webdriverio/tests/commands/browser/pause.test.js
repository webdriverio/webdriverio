import got from 'got'
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
        await browser.pause(500) // expect 500ms pause
        const end = Date.now()

        expect(end - start).toBeGreaterThan(499)
        expect(end - start).toBeLessThan(600)
        expect(got.mock.calls).toHaveLength(1)
    })

    it('should pause for default value', async () => {
        const start = Date.now()
        await browser.pause() // expect 1s pause
        const end = Date.now()

        expect(end - start).toBeGreaterThan(999)
        expect(end - start).toBeLessThan(1100)
        expect(got.mock.calls).toHaveLength(1)
    })

    afterEach(() => {
        got.mockClear()
    })
})
