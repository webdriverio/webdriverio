import got from 'got'
import { remote } from '../../../src'

describe('getHTML test', () => {
    it('should allow get html of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        elem.elementId = {
            outerHTML: '<some>outer html</some>',
            innerHTML: 'some inner html'
        }

        let result = await elem.getHTML()
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(result).toBe('<some>outer html</some>')

        result = await elem.getHTML(false)
        expect(result).toBe('some inner html')
    })

    afterEach(() => {
        got.mockClear()
    })
})
