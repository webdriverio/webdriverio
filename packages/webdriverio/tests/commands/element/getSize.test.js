import got from 'got'
import { remote } from '../../../src'

jest.setTimeout(3000)

describe('getSize test', () => {
    it('should allow to get the width and height of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const size = await elem.getSize()

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/rect')
        expect(size.width).toBe(50)
        expect(size.height).toBe(30)
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
        const size = await elem.getSize()

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/size')
        expect(size.width).toBe(50)
        expect(size.height).toBe(30)
    })

    it('should allow to get the width of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        const width = await elem.getSize('width')
        expect(width).toBe(50)
        const height = await elem.getSize('height')
        expect(height).toBe(30)
    })

    afterEach(() => {
        got.mockClear()
    })
})
