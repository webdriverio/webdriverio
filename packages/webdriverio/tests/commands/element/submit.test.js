import request from 'request'
import { remote } from '../../../src'

describe('submit test', () => {
    let browser
    let elem

    it('should allow to submit a form using w3c protocol', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')

        await elem.submit()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/element')
        expect(request.mock.calls[2][0].body.value).toBe('*[type="submit"]')
    })

    it('should allow to submit a form using jsonwp', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })
        elem = await browser.$('#foo')

        await elem.submit()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/submit')
    })

    afterEach(() => {
        request.mockClear()
    })
})
