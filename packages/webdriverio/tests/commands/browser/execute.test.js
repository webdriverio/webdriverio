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

        await browser.execute(() => 'foobar', 1, 2, 3)
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(request.mock.calls[1][0].body.script).toBe('return (() => \'foobar\').apply(null, arguments)')
        expect(request.mock.calls[1][0].body.args).toEqual([1, 2, 3])
    })

    it('should throw if script is wrong type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        expect(() => browser.execute(null)).toThrow()
        expect(() => browser.execute(1234)).toThrow()
    })
})
