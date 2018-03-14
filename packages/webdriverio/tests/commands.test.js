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

        it('should allow to check if element is displayed', async () => {
            await elem.isDisplayed()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/displayed')
        })

        it('should allow to get the text of an element', async () => {
            await elem.getText()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/text')
        })

        it('should allow to clear an input element', async () => {
            await elem.clearElement()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/clear')
        })

        it('should allow to get the tag name of an element', async () => {
            await elem.getTagName()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/name')
        })

        it('should allow to check if an element is enabled', async () => {
            await elem.isEnabled()
            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/enabled')
        })

        it('should allow to get the width and height of an element', async () => {
            const size = await elem.getElementSize()

            expect(request.mock.calls[0][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/rect');
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
    })

    afterEach(() => {
        request.mockClear()
    })
})
