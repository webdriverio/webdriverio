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
        expect(request.mock.calls[2][0].body.text).toEqual('foobar')
        expect(request.mock.calls[2][0].body.value).toEqual(undefined)
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
        expect(request.mock.calls[2][0].body.text).toEqual(undefined)
    })

    it('should allow to add value to an input element as workaround for /appium/issues/12085', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                'appium-version': '1.10.1'
            }
        })
        const elem = await browser.$('#foo')

        await elem.addValue('foobar')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
        expect(request.mock.calls[2][0].body.text).toEqual('foobar')
        expect(request.mock.calls[2][0].body.value).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
    })

    afterEach(() => {
        request.mockClear()
    })
})
