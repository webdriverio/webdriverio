import got from 'got'
import { remote } from '../../../src'

describe('getLocation test', () => {
    it('should allow to get the width and height of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const size = await elem.getLocation()

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/rect')
        expect(size.x).toBe(15)
        expect(size.y).toBe(20)
    })

    it('should allow to get the width and height of an element using jsonwp spec', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                jsonwpMode: true,
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const size = await elem.getLocation()

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/location')
        expect(size.x).toBe(15)
        expect(size.y).toBe(20)
    })

    it('should allow to get the x or y value of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const x = await elem.getLocation('x')
        const y = await elem.getLocation('y')
        expect(x).toBe(15)
        expect(y).toBe(20)
    })

    afterEach(() => {
        got.mockClear()
    })
})
