import got from 'got'
import { remote } from '../../../src'

describe('getProperty test', () => {
    it('should allow to get the property of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getProperty('tagName')

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/property/tagName')
        expect(property).toBe('BODY')
    })

    it('should allow to get the property of an element jsonwp style', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })
        const elem = await browser.$('#foo')
        elem.elementId = { tagName: 'BODY' }
        const property = await elem.getProperty('tagName')

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute')
        expect(property).toBe('BODY')
    })

    afterEach(() => {
        got.mockClear()
    })
})
