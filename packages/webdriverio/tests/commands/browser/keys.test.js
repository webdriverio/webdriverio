import request from 'request'
import { remote } from '../../../src'

describe('keys', () => {
    it('should send keys', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.keys('foobar')
        expect(request.mock.calls[1][0].uri.path).toContain('/actions')
        expect(request.mock.calls[1][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[1][0].body.actions[0].type).toBe('key')
        expect(request.mock.calls[1][0].body.actions[0].actions).toHaveLength('foobar'.length * 2)
        expect(request.mock.calls[1][0].body.actions[0].actions[0]).toEqual({ type: 'keyDown', value: 'f' })
        expect(request.mock.calls[1][0].body.actions[0].actions[11]).toEqual({ type: 'keyUp', value: 'r' })
    })

    it('should send keys (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        await browser.keys('foobar')
        expect(request.mock.calls[1][0].uri.path).toContain('/keys')
        expect(request.mock.calls[1][0].body.value).toEqual([ 'f', 'o', 'o', 'b', 'a', 'r' ])

        await browser.keys('Enter')
        expect(request.mock.calls[2][0].uri.path).toContain('/keys')
        expect(request.mock.calls[2][0].body.value).toEqual(['\uE007'])
    })

    afterEach(() => {
        request.mockClear()
    })
})
