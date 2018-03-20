import request from 'request'
import { remote } from '../../../src'

describe('isEnabled test', () => {
    it('should allow to check if an element is enabled', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const start = Date.now()
        await browser.pause(1000)
        expect((Date.now() - start) > 990).toBe(true)
        expect(request.mock.calls).toHaveLength(1)
    })
})
