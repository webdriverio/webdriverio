import request from 'request'
import { remote } from '../../../src'

describe('setValue', () => {
    test('should set the value clearning the element first', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/clear')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
        expect(request.mock.calls[3][0].body.text).toBe('foobar')
    })
})