import request from 'request'
import { remote } from '../../../src'

describe('elements', () => {
    let browser
    let elems

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })
    
    it('should fetch elements', async () => {
        elems = await browser.$$('.foo')
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/elements')
        expect(request.mock.calls[1][0].body).toEqual({ using: 'css selector', value: '.foo' })
        expect(elems).toHaveLength(3)

        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0].selector).toBe('.foo')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1].selector).toBe('.foo')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2].selector).toBe('.foo')
        expect(elems[2].index).toBe(2)
    })

    afterEach(() => {
        request.mockClear()
    })
})
