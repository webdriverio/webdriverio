import request from 'request'
import { remote } from '../../../src'

describe('addValue test', () => {
    it('should allow to add value to an input element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.addValue('foobar')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
        expect(request.mock.calls[2][0].body.text).toBe('foobar')
    })

    it('should allow to add value to an input element using jsonwp', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })
        const elem = await browser.$('#foo')

        await elem.addValue('foobar')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
        expect(request.mock.calls[2][0].body.value).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
    })

    afterEach(() => {
        request.mockClear()
    })
})
