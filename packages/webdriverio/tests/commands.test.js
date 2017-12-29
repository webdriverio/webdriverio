import request from 'request'
import { remote } from '../src'

describe('commands test', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should have a sessionId when instance was created', () => {
        expect(browser.sessionId).toBe('foobar-123')
        expect(request.mock.calls).toHaveLength(1)
        expect(request.mock.calls[0][0].method).toBe('POST')
        expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session')
    })

    describe('element commands', () => {
        it('should fetch an element', async () => {
            const elem = await browser.$('#foo')
            expect(request.mock.calls[0][0].method).toBe('POST')
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
            expect(request.mock.calls[0][0].body).toEqual({ using: 'id', value: 'foo' })
            expect(elem.elementId).toBe('some-elem-123')
        })
    })

    afterEach(() => {
        request.mockClear()
    })
})
