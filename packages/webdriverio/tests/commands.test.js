import request from 'request'
import { remote } from '../src'

describe('commands test', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
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

    describe('browser commands', () => {
        it('url', async () => {
            expect.assertions(4)

            await browser.url('http://google.com')
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/url')
            expect(request.mock.calls[0][0].body).toEqual({ url: 'http://google.com/' })
            await browser.url('/foobar')
            expect(request.mock.calls[1][0].body).toEqual({ url: 'http://foobar.com/foobar' })

            try {
                await browser.url(true)
            } catch (e) {
                expect(e.message).toContain('command needs to be type of string')
            }
        })
    })

    describe('element commands', () => {
        let elem

        beforeAll(async () => {
            elem = await browser.$('#foo')
        })

        it('should fetch an element', async () => {
            expect(request.mock.calls[0][0].method).toBe('POST')
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
            expect(request.mock.calls[0][0].body).toEqual({ using: 'id', value: 'foo' })
            expect(elem.elementId).toBe('some-elem-123')
        })

        it('should allow to click on an element', async () => {
            await elem.click()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/click')
        })

        it('should allow to get attribute from element', async () => {
            await elem.getAttribute('foo')
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/attribute/foo')
        })

        it('should allow to check if element is selected', async () => {
            await elem.isSelected()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/selected')
        })
    })

    afterEach(() => {
        request.mockClear()
    })
})
