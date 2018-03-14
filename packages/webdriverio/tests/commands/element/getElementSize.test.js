import request from 'request'
import { remote } from '../../../src'

describe('getElementSize test', () => {
    let browser
    let elem

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
    })

    it('should allow to get the width and height of an element', async () => {
        const size = await elem.getElementSize()

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/rect');
        expect(size.width).toBe(50)
        expect(size.height).toBe(30)
    })

    it('should allow to get the width of an element', async () => {
        const size = await elem.getElementSize('width')

        expect(size).toBe(50)
    })

    it('should allow to get the height of an element', async () => {
        const size = await elem.getElementSize('height')

        expect(size).toBe(30)
    })

    afterEach(() => {
        request.mockClear()
    })
})
